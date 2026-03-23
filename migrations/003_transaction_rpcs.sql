-- Migration 003: Add atomic transaction RPCs
-- These RPCs ensure transaction + wallet balance updates happen in one DB transaction.

-- Create a transaction and adjust wallet balance(s) atomically
CREATE OR REPLACE FUNCTION perform_transaction(
  p_user_id UUID,
  p_title VARCHAR(255),
  p_amount DECIMAL(15,2),
  p_type VARCHAR(50),
  p_category VARCHAR(50),
  p_wallet_id UUID,
  p_to_wallet_id UUID DEFAULT NULL,
  p_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_recurring BOOLEAN DEFAULT false,
  p_recurring_frequency VARCHAR(20) DEFAULT NULL,
  p_fee DECIMAL(15,2) DEFAULT 0,
  p_to_wallet_amount DECIMAL(15,2) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_txn transactions%ROWTYPE;
BEGIN
  -- Verify wallet ownership
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE id = p_wallet_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Wallet not found or not owned by user';
  END IF;

  -- Insert the transaction
  INSERT INTO transactions (user_id, title, amount, type, category, wallet_id, to_wallet_id, date, notes, recurring, recurring_frequency)
  VALUES (p_user_id, p_title, p_amount, p_type, p_category, p_wallet_id, p_to_wallet_id, p_date, p_notes, p_recurring,
          CASE WHEN p_recurring THEN p_recurring_frequency ELSE NULL END)
  RETURNING * INTO v_txn;

  -- Adjust source wallet balance
  IF p_type = 'income' THEN
    UPDATE wallets SET balance = balance + (p_amount - p_fee) WHERE id = p_wallet_id AND user_id = p_user_id;
  ELSIF p_type = 'expense' THEN
    UPDATE wallets SET balance = balance - (p_amount + p_fee) WHERE id = p_wallet_id AND user_id = p_user_id;
  ELSIF p_type = 'transfer' THEN
    UPDATE wallets SET balance = balance - (p_amount + p_fee) WHERE id = p_wallet_id AND user_id = p_user_id;
    IF p_to_wallet_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM wallets WHERE id = p_to_wallet_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'Destination wallet not found or not owned by user';
      END IF;
      UPDATE wallets SET balance = balance + COALESCE(p_to_wallet_amount, p_amount) WHERE id = p_to_wallet_id AND user_id = p_user_id;
    END IF;
  END IF;

  RETURN row_to_json(v_txn);
END;
$$;

-- Delete a transaction and reverse wallet balance atomically
CREATE OR REPLACE FUNCTION delete_transaction_atomic(
  p_user_id UUID,
  p_transaction_id UUID,
  p_fee DECIMAL(15,2) DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_txn transactions%ROWTYPE;
BEGIN
  -- Fetch and lock the transaction
  SELECT * INTO v_txn FROM transactions WHERE id = p_transaction_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not owned by user';
  END IF;

  -- Reverse wallet balance
  IF v_txn.type = 'income' THEN
    UPDATE wallets SET balance = balance - (v_txn.amount - p_fee) WHERE id = v_txn.wallet_id AND user_id = p_user_id;
  ELSIF v_txn.type = 'expense' THEN
    UPDATE wallets SET balance = balance + (v_txn.amount + p_fee) WHERE id = v_txn.wallet_id AND user_id = p_user_id;
  ELSIF v_txn.type = 'transfer' THEN
    UPDATE wallets SET balance = balance + (v_txn.amount + p_fee) WHERE id = v_txn.wallet_id AND user_id = p_user_id;
    IF v_txn.to_wallet_id IS NOT NULL THEN
      UPDATE wallets SET balance = balance - v_txn.amount WHERE id = v_txn.to_wallet_id AND user_id = p_user_id;
    END IF;
  END IF;

  -- Delete the transaction
  DELETE FROM transactions WHERE id = p_transaction_id AND user_id = p_user_id;
END;
$$;
