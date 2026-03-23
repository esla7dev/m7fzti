import React, { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/AuthContext";
import { useAllCategories } from "@/hooks/useCategoryQueries";

const frequencies = [
  { value: 'daily', label: 'يومياً' },
  { value: 'weekly', label: 'أسبوعياً' },
  { value: 'monthly', label: 'شهرياً' },
  { value: 'yearly', label: 'سنوياً' }
];

export default function AddTransactionModal({ isOpen, onClose, onSubmit, wallets, defaultType }) {
  const { user } = useAuth();
  const categories = useAllCategories(user?.id);
  const [activeTab, setActiveTab] = useState(defaultType || 'income');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'income',
    category: 'salary',
    wallet_id: '',
    to_wallet_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    recurring: false,
    recurring_frequency: 'monthly'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notesPreview, setNotesPreview] = useState(false);

  const getDefaultCategory = (type) => {
    switch (type) {
      case 'income': return 'salary';
      case 'expense': return 'food';
      case 'transfer': return 'other';
      default: return 'other';
    }
  };

  // Sync activeTab when opened via QuickActions with a defaultType
  React.useEffect(() => {
    if (isOpen && defaultType) {
      setActiveTab(defaultType);
      setFormData(prev => ({
        ...prev,
        type: defaultType,
        category: getDefaultCategory(defaultType)
      }));
    }
  }, [isOpen, defaultType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount || !formData.wallet_id) return;
    
    setIsSubmitting(true);
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        type: activeTab
      };
      
      await onSubmit(transactionData);
      
      // Reset form
      setFormData({
        title: '',
        amount: '',
        type: 'income',
        category: 'salary',
        wallet_id: '',
        to_wallet_id: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        recurring: false,
        recurring_frequency: 'monthly'
      });
      setActiveTab('income');
      setNotesPreview(false);
    } catch (error) {
      console.error('خطأ في إضافة المعاملة:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setFormData({
      ...formData,
      type: newTab,
      category: getDefaultCategory(newTab)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">إضافة معاملة جديدة</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 dark:bg-gray-700">
            <TabsTrigger value="income" className="dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-gray-100 dark:text-gray-300">دخل</TabsTrigger>
            <TabsTrigger value="expense" className="dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-gray-100 dark:text-gray-300">مصروف</TabsTrigger>
            <TabsTrigger value="transfer" className="dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-gray-100 dark:text-gray-300">تحويل</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="dark:text-gray-300">العنوان</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثل: راتب الشهر"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="dark:text-gray-300">المبلغ</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="dark:text-gray-300">الفئة</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  {categories.map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      <div className="flex items-center gap-2">
                        <span>{category.emoji}</span>
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wallet */}
            <div>
              <Label htmlFor="wallet" className="dark:text-gray-300">
                {activeTab === 'transfer' ? 'من المحفظة' : 'المحفظة'}
              </Label>
              <Select 
                value={formData.wallet_id} 
                onValueChange={(value) => setFormData({ ...formData, wallet_id: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="اختر المحفظة" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: wallet.color }}
                        />
                        <span>{wallet.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({wallet.balance?.toLocaleString()} {wallet.currency === 'EGP' ? 'ج.م' : wallet.currency})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To Wallet (for transfers) */}
            {activeTab === 'transfer' && (
              <div>
                <Label htmlFor="to_wallet" className="dark:text-gray-300">إلى المحفظة</Label>
                <Select 
                  value={formData.to_wallet_id} 
                  onValueChange={(value) => setFormData({ ...formData, to_wallet_id: value })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <SelectValue placeholder="اختر المحفظة" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                    {wallets.filter(w => w.id !== formData.wallet_id).map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: wallet.color }}
                          />
                          <span>{wallet.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date */}
            <div>
              <Label htmlFor="date" className="dark:text-gray-300">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>

            {/* Recurring Transaction */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
                />
                <Label htmlFor="recurring" className="dark:text-gray-300 mr-2">معاملة متكررة</Label>
              </div>
              
              {formData.recurring && (
                <div>
                  <Label htmlFor="frequency" className="dark:text-gray-300">التكرار</Label>
                  <Select 
                    value={formData.recurring_frequency} 
                    onValueChange={(value) => setFormData({ ...formData, recurring_frequency: value })}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="notes" className="dark:text-gray-300">ملاحظات (اختياري)</Label>
                {formData.notes && (
                  <button type="button" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setNotesPreview(!notesPreview)}>
                    {notesPreview ? <Pencil className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {notesPreview ? 'تحرير' : 'معاينة'}
                  </button>
                )}
              </div>
              {notesPreview && formData.notes ? (
                <div className="min-h-[4rem] p-3 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{formData.notes}</ReactMarkdown>
                </div>
              ) : (
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أضف ملاحظات إضافية... (يدعم Markdown)"
                  rows={2}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              )}
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
                disabled={isSubmitting || !formData.title.trim() || !formData.amount || !formData.wallet_id}
              >
                {isSubmitting ? 'جاري الإضافة...' : 'إضافة المعاملة'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}