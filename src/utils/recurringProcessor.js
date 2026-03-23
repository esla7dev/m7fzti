import { supabase } from '@/api/supabaseClient';
import { transactionService } from '@/api/services/transactionService';

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

/**
 * Process recurring transactions for a user.
 * Checks all recurring transactions and creates new instances
 * for any that are due based on last_triggered_date + frequency.
 * Uses conditional update on last_triggered_date for idempotency
 * (prevents duplicate creation from concurrent tabs).
 * Returns the number of transactions created.
 */
export async function processRecurringTransactions(userId) {
  try {
    const { data: recurring, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('recurring', true);

    if (error || !recurring?.length) return 0;

    const today = new Date().toISOString().split('T')[0];
    let created = 0;

    for (const txn of recurring) {
      const lastDate = txn.last_triggered_date || txn.date;
      if (!lastDate || !txn.recurring_frequency) continue;

      let nextDue = getNextDate(lastDate, txn.recurring_frequency);
      if (!nextDue || nextDue > today) continue;

      // Calculate the final triggered date first
      let finalDate = lastDate;
      let check = getNextDate(lastDate, txn.recurring_frequency);
      while (check && check <= today) {
        finalDate = check;
        check = getNextDate(check, txn.recurring_frequency);
      }

      // Atomically claim this recurring txn by conditionally updating last_triggered_date.
      // If another tab already advanced it, this update matches 0 rows and we skip.
      const { data: claimed } = await supabase
        .from('transactions')
        .update({ last_triggered_date: finalDate })
        .eq('id', txn.id)
        .eq('last_triggered_date', txn.last_triggered_date ?? txn.date)
        .select('id');

      if (!claimed?.length) continue; // Another tab already processed this

      // Now create all missed occurrences up to today
      while (nextDue && nextDue <= today) {
        const { id, user_id, created_at, updated_date, last_triggered_date, recurring, recurring_frequency, ...txData } = txn;
        await transactionService.create(userId, {
          ...txData,
          date: nextDue,
          notes: txData.notes ? `${txData.notes} (تكرار تلقائي)` : '(تكرار تلقائي)',
        });
        created++;
        nextDue = getNextDate(nextDue, txn.recurring_frequency);
      }
    }

    return created;
  } catch {
    return 0;
  }
}
