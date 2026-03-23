/**
 * One-time migration script: legacy CSV -> Supabase
 * 
 * Usage:
 *   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local
 *   2. Place CSV files in project root or update paths below
 *   3. Run: node migrate-data.mjs
 *   4. Delete this file after successful migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// --- Read env from .env.local ---
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing env vars. Make sure .env.local has:');
  console.error('   VITE_SUPABASE_URL=...');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USER_ID = '072f08fb-bcf5-4be8-8133-a3c47609210c';

// --- CSV paths ---
const TX_CSV_PATH = 'C:\\Users\\Essam\\Downloads\\Transaction_export (1).csv';
const WALLET_CSV_PATH = 'C:\\Users\\Essam\\Downloads\\Wallet_export (1).csv';

// =============================================
// CSV PARSER (handles quoted fields with commas)
// =============================================
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// =============================================
// READ AND PARSE CSVs
// =============================================
console.log('Reading CSV files...');
const walletRows = parseCSV(readFileSync(WALLET_CSV_PATH, 'utf-8'));
const txRows = parseCSV(readFileSync(TX_CSV_PATH, 'utf-8'));
console.log(`  Wallets CSV: ${walletRows.length} rows`);
console.log(`  Transactions CSV: ${txRows.length} rows`);

// Current wallet IDs (the 3 wallets that still exist)
const CURRENT_WALLET_IDS = new Set(walletRows.map(w => w.id));

// =============================================
// MIGRATION LOGIC
// =============================================

async function migrate() {
  console.log('=== Legacy CSV -> Supabase Migration ===\n');

  // --- Phase 0: Ensure user exists in users table ---
  console.log('Checking user in users table...');
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', USER_ID)
    .single();

  if (!existingUser) {
    console.log('  User not found, inserting...');
    const { error: userErr } = await supabase
      .from('users')
      .insert([{ id: USER_ID, email: 'omarelsahy80@gmail.com' }]);
    if (userErr) {
      console.error('❌ Failed to insert user:', userErr.message);
      process.exit(1);
    }
    console.log('  ✅ User inserted');
  } else {
    console.log('  ✅ User already exists');
  }

  // --- Phase 1: Filter transactions ---
  const kept = [];
  const dropped = [];

  for (const tx of txRows) {
    const walletOk = CURRENT_WALLET_IDS.has(tx.wallet_id);
    const toWalletOk = tx.type === 'transfer'
      ? CURRENT_WALLET_IDS.has(tx.to_wallet_id)
      : true;

    if (walletOk && toWalletOk) {
      kept.push(tx);
    } else {
      dropped.push(tx);
    }
  }

  console.log(`Transactions: ${txRows.length} total, ${kept.length} to import, ${dropped.length} dropped\n`);

  // --- Phase 2: Create wallets ---
  console.log('Creating wallets...');
  const walletIdMap = {};

  for (const w of walletRows) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('wallets')
      .insert([{
        user_id: USER_ID,
        name: w.name,
        type: (w.type || 'bank').toLowerCase(),
        balance: parseFloat(w.balance) || 0,
        currency: w.currency || 'EGP',
        color: w.color || '#3b82f6',
        icon: w.icon || 'wallet',
        usage_fee: parseFloat(w.usage_fee) || 0,
        transfer_fee: parseFloat(w.transfer_fee) || 0,
        fee_type: w.fee_type || 'fixed',
        is_active: w.is_active !== 'false',
        created_at: w.created_date || now,
        updated_at: w.updated_date || now,
      }])
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create wallet "${w.name}":`, error.message);
      process.exit(1);
    }

    walletIdMap[w.id] = data.id;
    console.log(`  ✅ ${w.name}: ${data.id} (balance: ${data.balance} ${data.currency})`);
  }

  console.log('');

  // --- Phase 3: Import transactions in batches ---
  console.log('Importing transactions...');

  // Sort by created_date ascending (chronological order)
  kept.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const BATCH_SIZE = 50;
  let imported = 0;

  for (let i = 0; i < kept.length; i += BATCH_SIZE) {
    const batch = kept.slice(i, i + BATCH_SIZE);
    const rows = batch.map(tx => ({
      user_id: USER_ID,
      wallet_id: walletIdMap[tx.wallet_id],
      to_wallet_id: tx.type === 'transfer' ? (walletIdMap[tx.to_wallet_id] || null) : null,
      title: tx.title || 'Untitled',
      type: tx.type,
      category: tx.category || 'other',
      amount: parseFloat(tx.amount) || 0,
      date: tx.date,
      notes: tx.notes || null,
      recurring: tx.recurring === 'true' || tx.recurring === 'True' ? true : false,
      recurring_frequency: tx.recurring_frequency || null,
      created_at: tx.created_date,
      updated_at: tx.updated_date,
    }));

    const { error } = await supabase
      .from('transactions')
      .insert(rows);

    if (error) {
      console.error(`❌ Failed to insert batch starting at index ${i}:`, error.message);
      console.error('  First row in batch:', JSON.stringify(rows[0], null, 2));
      process.exit(1);
    }

    imported += batch.length;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} transactions inserted (${imported}/${kept.length})`);
  }

  console.log('');

  // --- Phase 4: Verify ---
  console.log('Verifying...');

  const { data: dbWallets, error: wErr } = await supabase
    .from('wallets')
    .select('id, name, balance, currency')
    .eq('user_id', USER_ID);

  if (wErr) {
    console.error('❌ Failed to verify wallets:', wErr.message);
  } else {
    console.log(`  Wallets in DB: ${dbWallets.length}`);
    for (const w of dbWallets) {
      console.log(`    ${w.name}: ${w.balance} ${w.currency}`);
    }
  }

  const { count, error: tErr } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID);

  if (tErr) {
    console.error('❌ Failed to verify transactions:', tErr.message);
  } else {
    console.log(`  Transactions in DB: ${count}`);
  }

  console.log('\n=== Migration Complete ===');
  console.log(`  ✅ ${walletRows.length} wallets created (balances set from CSV)`);
  console.log(`  ✅ ${imported} transactions imported`);
  console.log(`  ⛔ ${dropped.length} transactions dropped (orphaned wallets)`);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
