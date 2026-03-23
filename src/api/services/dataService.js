import { transactionService } from '@/api/services/transactionService';
import { walletService } from '@/api/services/walletService';
import { budgetService } from '@/api/services/budgetService';
import { wishlistService } from '@/api/services/wishlistService';
import { userSettingsService } from '@/api/services/userSettingsService';

// ─── CSV helpers ──────────────────────────────────────────────
function escapeCsvField(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCsvRow(fields) {
  return fields.map(escapeCsvField).join(',');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Export all data as JSON ──────────────────────────────────
export async function exportJSON(userId) {
  const [transactions, wallets, budgets, wishlist, settings] = await Promise.all([
    transactionService.getAll(userId),
    walletService.getAll(userId),
    budgetService.getAll(userId),
    wishlistService.getAll(userId),
    userSettingsService.get(userId),
  ]);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    wallets,
    budgets,
    wishlist,
    settings,
  };

  const json = JSON.stringify(payload, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(json, `finance-backup-${date}.json`, 'application/json');
}

// ─── Export transactions as CSV ───────────────────────────────
export async function exportTransactionsCSV(userId) {
  const transactions = await transactionService.getAll(userId);

  const header = toCsvRow(['التاريخ', 'العنوان', 'النوع', 'الفئة', 'المبلغ', 'المحفظة', 'ملاحظات']);
  const rows = transactions.map(t =>
    toCsvRow([t.date, t.title, t.type, t.category, t.amount, t.wallet_id, t.notes])
  );

  const csv = [header, ...rows].join('\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `transactions-${date}.csv`, 'text/csv');
}

// ─── Import JSON backup ──────────────────────────────────────
export function importJSON(userId) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) { resolve({ imported: false }); return; }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !data.transactions) {
          throw new Error('ملف غير صالح — يبدو أنه ليس ملف نسخة احتياطية للتطبيق');
        }

        let walletsImported = 0;
        let transactionsImported = 0;
        let budgetsImported = 0;
        let wishlistImported = 0;

        // Map old wallet IDs → new wallet IDs so transaction references survive
        const walletIdMap = {};

        // Import wallets first (transactions reference them)
        if (data.wallets?.length) {
          for (const w of data.wallets) {
            const { id: oldId, user_id, created_at, updated_at, updated_date, ...walletData } = w;
            const newWallet = await walletService.create(userId, walletData);
            if (oldId && newWallet?.id) walletIdMap[oldId] = newWallet.id;
            walletsImported++;
          }
        }

        // Import transactions (remap wallet references)
        if (data.transactions?.length) {
          for (const t of data.transactions) {
            const { id, user_id, created_at, updated_at, updated_date, ...txData } = t;
            // Remap wallet IDs using the map, fall back to null if wallet wasn't found
            if (txData.wallet_id) txData.wallet_id = walletIdMap[txData.wallet_id] || null;
            if (txData.to_wallet_id) txData.to_wallet_id = walletIdMap[txData.to_wallet_id] || null;
            await transactionService.create(userId, txData);
            transactionsImported++;
          }
        }

        // Import budgets
        if (data.budgets?.length) {
          for (const b of data.budgets) {
            const { id, user_id, created_at, updated_at, updated_date, spent_amount, ...budgetData } = b;
            await budgetService.create(userId, budgetData);
            budgetsImported++;
          }
        }

        // Import wishlist
        if (data.wishlist?.length) {
          for (const w of data.wishlist) {
            const { id, user_id, created_at, updated_at, updated_date, ...wishData } = w;
            await wishlistService.create(userId, wishData);
            wishlistImported++;
          }
        }

        // Import settings
        if (data.settings) {
          const { id, user_id, created_at, updated_at, ...settingsData } = data.settings;
          await userSettingsService.update(userId, settingsData);
        }

        resolve({
          imported: true,
          wallets: walletsImported,
          transactions: transactionsImported,
          budgets: budgetsImported,
          wishlist: wishlistImported,
        });
      } catch (err) {
        reject(err);
      }
    });

    input.click();
  });
}
