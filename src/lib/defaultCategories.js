/**
 * Default built-in categories shared across the entire app.
 * These are app-level constants — users cannot edit or delete them.
 * Users may add their own custom categories via Settings → Category Management.
 *
 * Shape: { key: string, label: string, emoji: string }
 * `key` is stored in transactions.category and budgets.category.
 */
export const DEFAULT_CATEGORIES = [
  { key: 'salary',        label: 'راتب',      emoji: '💼' },
  { key: 'food',          label: 'طعام',      emoji: '🍽️' },
  { key: 'transport',     label: 'مواصلات',   emoji: '🚗' },
  { key: 'entertainment', label: 'ترفيه',     emoji: '🎬' },
  { key: 'bills',         label: 'فواتير',    emoji: '💡' },
  { key: 'shopping',      label: 'تسوق',      emoji: '🛍️' },
  { key: 'health',        label: 'صحة',       emoji: '⚕️' },
  { key: 'education',     label: 'تعليم',     emoji: '📚' },
  { key: 'investment',    label: 'استثمار',   emoji: '📈' },
  { key: 'other',         label: 'أخرى',      emoji: '💫' },
];

/** Fast lookup: key → label (falls back to the raw key). */
export function getCategoryLabel(key, customCategories = []) {
  const custom = customCategories.find(c => c.key === key);
  if (custom) return custom.label;
  const def = DEFAULT_CATEGORIES.find(c => c.key === key);
  return def ? def.label : key;
}

/** Fast lookup: key → emoji (falls back to '📁'). */
export function getCategoryEmoji(key, customCategories = []) {
  const custom = customCategories.find(c => c.key === key);
  if (custom) return custom.emoji;
  const def = DEFAULT_CATEGORIES.find(c => c.key === key);
  return def ? def.emoji : '📁';
}
