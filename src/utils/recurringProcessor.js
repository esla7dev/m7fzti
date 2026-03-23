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

      // Create all missed occurrences up to today
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

      // Update last_triggered_date
      const lastCreatedDate = getNextDate(lastDate, txn.recurring_frequency);
      let finalDate = lastDate;
      let check = lastCreatedDate;
      while (check && check <= today) {
        finalDate = check;
        check = getNextDate(check, txn.recurring_frequency);
      }

      await supabase
        .from('transactions')
        .update({ last_triggered_date: finalDate })
        .eq('id', txn.id);
    }

    return created;
  } catch {
    return 0;
  }
}
