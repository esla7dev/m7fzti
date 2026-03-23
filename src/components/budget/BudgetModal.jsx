import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { useAllCategories } from '@/hooks/useCategoryQueries';

export default function BudgetModal({ isOpen, onClose, onSubmit, editingBudget }) {
  const { user } = useAuth();
  const allCategories = useAllCategories(user?.id);
  const [category, setCategory]       = useState('food');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod]           = useState('monthly');

  useEffect(() => {
    if (editingBudget) {
      setCategory(editingBudget.category || 'food');
      setLimitAmount(String(editingBudget.limit_amount || ''));
      setPeriod(editingBudget.period || 'monthly');
    } else {
      setCategory('food');
      setLimitAmount('');
      setPeriod('monthly');
    }
  }, [editingBudget, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(limitAmount);
    if (!amount || amount <= 0) return;
    onSubmit({ category, limit_amount: amount, period });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            {editingBudget ? 'تعديل الميزانية' : 'إضافة ميزانية'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-gray-200">الفئة</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                {allCategories.map(cat => (
                  <SelectItem key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">الحد الأقصى (ج.م)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder="مثال: 2000"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">الفترة</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="yearly">سنوي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">
              {editingBudget ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 dark:border-gray-600 dark:text-gray-200"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
