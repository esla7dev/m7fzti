import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgetQueries';
import BudgetCard from './BudgetCard';
import BudgetModal from './BudgetModal';

export default function BudgetList({ userId, transactions }) {
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const { data: budgets = [] } = useBudgets(userId);
  const createBudget = useCreateBudget(userId);
  const updateBudget = useUpdateBudget(userId);
  const deleteBudget = useDeleteBudget(userId);

  const getSpentAmount = (budget) => {
    const now = new Date();
    return (transactions || [])
      .filter(t => {
        if (t.type !== 'expense' || t.category !== budget.category) return false;
        const tDate = new Date(t.date);
        if (budget.period === 'yearly') {
          return tDate.getFullYear() === now.getFullYear();
        }
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingBudget) {
        await updateBudget.mutateAsync({ budgetId: editingBudget.id, data });
        toast.success('تم تعديل الميزانية');
        setEditingBudget(null);
      } else {
        await createBudget.mutateAsync(data);
        toast.success('تم إضافة الميزانية');
        setIsModalOpen(false);
      }
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى');
    }
  };

  const handleDelete = async (budget) => {
    try {
      await deleteBudget.mutateAsync(budget.id);
      toast.success('تم حذف الميزانية');
    } catch {
      toast.error('فشل حذف الميزانية');
    }
  };

  const modalOpen  = isModalOpen || !!editingBudget;
  const closeModal = () => { setIsModalOpen(false); setEditingBudget(null); };

  return (
    <Card className="bg-white shadow-lg border-0 dark:bg-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Target className="w-4 h-4 text-primary" />
            الميزانيات
          </CardTitle>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {budgets.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              لا توجد ميزانيات. أضف ميزانية للتحكم في مصروفاتك.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="w-full dark:border-gray-600 dark:text-gray-200"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة ميزانية
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                spent={getSpentAmount(budget)}
                onEdit={setEditingBudget}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>

      <BudgetModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingBudget={editingBudget}
      />
    </Card>
  );
}
