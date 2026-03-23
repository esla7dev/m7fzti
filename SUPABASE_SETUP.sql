-- ============================================
-- SUPABASE DATABASE SCHEMA SETUP
-- ============================================
-- Run these SQL commands in Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query)

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(254) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  balance DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'EGP',
  color VARCHAR(7),
  usage_fee DECIMAL(10, 4) DEFAULT 0,
  transfer_fee DECIMAL(10, 4) DEFAULT 0,
  fee_type VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_date TIMESTAMP DEFAULT now(),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'income', 'expense', 'transfer'
  category VARCHAR(50),
  amount DECIMAL(15, 2) NOT NULL,
  date DATE,
  notes TEXT,
  to_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
  last_triggered_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_date TIMESTAMP DEFAULT now(),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  CONSTRAINT transactions_to_wallet_id_fkey FOREIGN KEY (to_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'ar',
  primary_color VARCHAR(7) DEFAULT '#10b981',
  secondary_color VARCHAR(7) DEFAULT '#065f46',
  accent_color VARCHAR(7) DEFAULT '#34d399',
  notifications_enabled BOOLEAN DEFAULT true,
  budget_alerts BOOLEAN DEFAULT true,
  default_currency VARCHAR(10) DEFAULT 'EGP',
  large_transaction_threshold DECIMAL(15, 2) DEFAULT 5000,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wishlist Items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  target_amount DECIMAL(15, 2),
  current_amount DECIMAL(15, 2) DEFAULT 0,
  priority VARCHAR(20),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT now(),
  updated_date TIMESTAMP DEFAULT now(),
  CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Budgets table (NEW FEATURE)
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  limit_amount DECIMAL(15, 2) NOT NULL,
  spent_amount DECIMAL(15, 2) DEFAULT 0,
  period VARCHAR(20), -- 'monthly', 'yearly'
  month DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'budget_warning', 'budget_exceeded', 'large_transaction', 'recurring_reminder'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Users policies
CREATE POLICY "users_can_view_own_data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_update_own_data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Wallets policies
CREATE POLICY "users_can_view_own_wallets" 
  ON wallets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_wallets" 
  ON wallets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_wallets" 
  ON wallets FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_wallets" 
  ON wallets FOR DELETE 
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "users_can_view_own_transactions" 
  ON transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_transactions" 
  ON transactions FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_transactions" 
  ON transactions FOR DELETE 
  USING (auth.uid() = user_id);

-- User Settings policies
CREATE POLICY "users_can_view_own_settings" 
  ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_settings" 
  ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_settings" 
  ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Wishlist Items policies
CREATE POLICY "users_can_view_own_wishlist" 
  ON wishlist_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_wishlist" 
  ON wishlist_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_wishlist" 
  ON wishlist_items FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_wishlist" 
  ON wishlist_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "users_can_view_own_budgets" 
  ON budgets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_budgets" 
  ON budgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_budgets" 
  ON budgets FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_budgets" 
  ON budgets FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ============================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update 'updated_date' timestamp
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for user_settings updated_at
CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for transactions updated_date
CREATE TRIGGER update_transactions_updated_date 
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date_column();

-- Triggers for wallets updated_date
CREATE TRIGGER update_wallets_updated_date 
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date_column();

-- Triggers for wishlist_items updated_date
CREATE TRIGGER update_wishlist_items_updated_date 
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date_column();

-- Triggers for budgets updated_at
CREATE TRIGGER update_budgets_updated_at 
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CREATE AUDIT LOG TABLE (OPTIONAL)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255),
  table_name VARCHAR(255),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_audit_logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. USER CUSTOM CATEGORIES
-- ============================================
-- Allows users to create their own categories beyond the 10 built-in defaults.
-- The `id` (UUID) of a custom category is stored as the category key in
-- transactions.category and budgets.category.

CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📁',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_categories_user_id ON user_categories(user_id);

ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_categories"
  ON user_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_categories"
  ON user_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_categories"
  ON user_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_categories"
  ON user_categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- All tables, policies, and triggers have been created
-- Your Supabase database is ready for the application!

-- ============================================
-- 8. TRANSACTION RPCs (ATOMIC WALLET UPDATES)
-- ============================================
-- These RPCs ensure that transaction creation/deletion and wallet balance
-- updates happen in a single database transaction, preventing race conditions.

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
