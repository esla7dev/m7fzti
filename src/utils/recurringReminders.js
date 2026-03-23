import { supabase } from '@/api/supabaseClient';
import { notificationService } from '@/api/services/notificationService';

function getNextDate(dateStr, frequency) {
  const d = new Date(dateStr);
  switch (frequency) {
    case 'daily':   d.setDate(d.getDate() + 1); break;
    case 'weekly':  d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d.toISOString().split('T')[0];
}

const FREQ_LABELS = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
  yearly: 'سنوي',
};

/**
 * Check recurring transactions and create reminder notifications
 * for any that are due tomorrow. Prevents duplicate reminders
 * by checking if a reminder was already created today.
 */
export async function checkRecurringReminders(userId) {
  try {
    const { data: recurring, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('recurring', true);

    if (error || !recurring?.length) return 0;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Check for existing reminders created today to prevent duplicates
    const { data: existingReminders } = await supabase
      .from('notifications')
      .select('message')
      .eq('user_id', userId)
      .eq('type', 'recurring_reminder')
      .gte('created_at', todayStr + 'T00:00:00')
      .lte('created_at', todayStr + 'T23:59:59');

    const existingMessages = new Set((existingReminders || []).map(n => n.message));
    let created = 0;

    for (const txn of recurring) {
      const lastDate = txn.last_triggered_date || txn.date;
      if (!lastDate || !txn.recurring_frequency) continue;

      const nextDue = getNextDate(lastDate, txn.recurring_frequency);
      if (!nextDue || nextDue !== tomorrowStr) continue;

      const freqLabel = FREQ_LABELS[txn.recurring_frequency] || txn.recurring_frequency;
      const typeLabel = txn.type === 'income' ? 'إيراد' : 'مصروف';
      const message = `${txn.category} - ${txn.amount} ج.م (${typeLabel} ${freqLabel}) مستحق غداً ${tomorrowStr}`;

      // Skip if we already sent this reminder today
      if (existingMessages.has(message)) continue;

      await notificationService.create(userId, {
        type: 'recurring_reminder',
        title: 'تذكير بمعاملة متكررة',
        message,
      });
      created++;
    }

    return created;
  } catch {
    return 0;
  }
}
