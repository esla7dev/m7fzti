export const QUERY_KEYS = {
  wallets: (userId) => ['wallets', userId],
  transactions: (userId) => ['transactions', userId],
  transactionsRecent: (userId) => ['transactions_recent', userId],
  budgets: (userId) => ['budgets', userId],
  notifications: (userId) => ['notifications', userId],
  notificationCount: (userId) => ['notification_count', userId],
  wishlist: (userId) => ['wishlist', userId],
  categories: (userId) => ['categories', userId],
};
