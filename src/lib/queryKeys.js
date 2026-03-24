export const QUERY_KEYS = {
  wallets: (userId) => ['wallets', userId],
  transactions: (userId) => ['transactions', userId],
  transactionsRecent: (userId, limit = 10) => ['transactions_recent', userId, limit],
  transactionsMonthly: (userId, year, month) => ['transactions_monthly', userId, year, month],
  budgets: (userId) => ['budgets', userId],
  notifications: (userId) => ['notifications', userId],
  notificationCount: (userId) => ['notification_count', userId],
  wishlist: (userId) => ['wishlist', userId],
  categories: (userId) => ['categories', userId],
};
