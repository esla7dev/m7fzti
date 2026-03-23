
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, CreditCard, PiggyBank, Landmark, TrendingUp } from "lucide-react";

const walletTypes = [
  { value: 'cash', label: 'نقدي', icon: Wallet },
  { value: 'bank', label: 'بنكي', icon: Landmark },
  { value: 'credit_card', label: 'بطاقة ائتمان', icon: CreditCard },
  { value: 'savings', label: 'ادخار', icon: PiggyBank },
  { value: 'investment', label: 'استثمار', icon: TrendingUp }
];

const colorOptions = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
];

export default function AddWalletModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    balance: 0,
    currency: 'EGP',
    color: '#10b981',
    usage_fee: 0,
    transfer_fee: 0,
    fee_type: 'fixed'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        type: 'cash',
        balance: 0,
        currency: 'EGP',
        color: '#10b981',
        usage_fee: 0,
        transfer_fee: 0,
        fee_type: 'fixed'
      });
    } catch (error) {
      console.error('خطأ في إضافة المحفظة:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">إضافة محفظة جديدة</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="dark:text-gray-300">اسم المحفظة</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثل: محفظة النقدية"
              required
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          <div>
            <Label htmlFor="type" className="dark:text-gray-300">نوع المحفظة</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                {walletTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="balance" className="dark:text-gray-300">الرصيد الابتدائي</Label>
              <Input
                id="balance"
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
            
            <div>
              <Label htmlFor="currency" className="dark:text-gray-300">العملة</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  <SelectItem value="EGP">جنيه مصري</SelectItem>
                  <SelectItem value="USD">دولار أمريكي</SelectItem>
                  <SelectItem value="SAR">ريال سعودي</SelectItem>
                  <SelectItem value="EUR">يورو</SelectItem>
                  <SelectItem value="GBP">جنيه إسترليني</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="dark:text-gray-300">نوع الرسوم</Label>
            <Select 
              value={formData.fee_type} 
              onValueChange={(value) => setFormData({ ...formData, fee_type: value })}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                <SelectItem value="percentage">نسبة مئوية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="usage_fee" className="dark:text-gray-300">
                رسم الاستخدام {formData.fee_type === 'percentage' ? '(%)' : '(ج.م)'}
              </Label>
              <Input
                id="usage_fee"
                type="number"
                value={formData.usage_fee}
                onChange={(e) => setFormData({ ...formData, usage_fee: parseFloat(e.target.value) || 0 })}
                min="0"
                step={formData.fee_type === 'percentage' ? '0.1' : '0.01'}
                max={formData.fee_type === 'percentage' ? '100' : undefined}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
            
            <div>
              <Label htmlFor="transfer_fee" className="dark:text-gray-300">
                رسم التحويل {formData.fee_type === 'percentage' ? '(%)' : '(ج.م)'}
              </Label>
              <Input
                id="transfer_fee"
                type="number"
                value={formData.transfer_fee}
                onChange={(e) => setFormData({ ...formData, transfer_fee: parseFloat(e.target.value) || 0 })}
                min="0"
                step={formData.fee_type === 'percentage' ? '0.1' : '0.01'}
                max={formData.fee_type === 'percentage' ? '100' : undefined}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
          </div>

          <div>
            <Label className="dark:text-gray-300">اللون</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-gray-400 dark:border-gray-200' : 'border-gray-200 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة المحفظة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
