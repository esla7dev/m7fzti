import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useAllCategories } from '@/hooks/useCategoryQueries';

export default function BudgetCard({ budget, spent, onEdit, onDelete }) {
  const { user } = useAuth();
  const allCategories = useAllCategories(user?.id);
  const getCatLabel = (key) => allCategories.find(c => c.key === key)?.label ?? key;
  const getCatEmoji = (key) => allCategories.find(c => c.key === key)?.emoji ?? '📁';

  const limit = budget.limit_amount || 0;
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const remaining = Math.max(limit - spent, 0);

  const barColor =
    percentage >= 100 ? 'bg-red-500' :
    percentage >= 80  ? 'bg-yellow-500' :
    'bg-green-500';

  const percentageColor =
    percentage >= 100 ? 'text-red-600 dark:text-red-400' :
    percentage >= 80  ? 'text-yellow-600 dark:text-yellow-400' :
    'text-green-600 dark:text-green-400';

  return (
    <div className="border dark:border-gray-700 rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {getCatEmoji(budget.category)} {getCatLabel(budget.category)}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {budget.period === 'yearly' ? 'سنوي' : 'شهري'}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(budget)}>
            <Pencil className="w-3 h-3 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(budget)}>
            <Trash2 className="w-3 h-3 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className={`font-bold ${percentageColor}`}>{spent.toLocaleString()} ج.م</span>
          <span className="text-gray-500 dark:text-gray-400">/ {limit.toLocaleString()} ج.م</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className={percentageColor}>{percentage.toFixed(0)}% مُستخدم</span>
          <span>متبقي: {remaining.toLocaleString()} ج.م</span>
        </div>
      </div>
    </div>
  );
}
