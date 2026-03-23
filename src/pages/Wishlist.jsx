
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Heart, Edit, Trash2, ShoppingCart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { useWishlist, useCreateWishlistItem, useUpdateWishlistItem, useDeleteWishlistItem } from '@/hooks/useWishlistQueries';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WishlistPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);

  const { data: items = [], isLoading: loading } = useWishlist(user?.id);
  const createItem = useCreateWishlistItem(user?.id);
  const updateItem = useUpdateWishlistItem(user?.id);
  const deleteItem = useDeleteWishlistItem(user?.id);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price')),
      priority: formData.get('priority'),
      link: formData.get('link'),
      notes: formData.get('notes'),
    };

    try {
      if (editingItem) {
        await updateItem.mutateAsync({ itemId: editingItem.id, data });
        toast.success('Item updated successfully');
      } else {
        await createItem.mutateAsync(data);
        toast.success('Item added successfully');
      }
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success('Item deleted successfully');
      setDeletingItemId(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };
  
  const handleMarkAsPurchased = async (item) => {
    try {
      await updateItem.mutateAsync({ itemId: item.id, data: { status: 'purchased' } });
      toast.success('Item marked as purchased');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  }

  const priorityMap = {
    high: { label: 'عالية', color: 'bg-red-100 text-red-700', icon: <Star className="w-3 h-3" /> },
    medium: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-700', icon: <Star className="w-3 h-3" /> },
    low: { label: 'منخفضة', color: 'bg-green-100 text-green-700', icon: <Star className="w-3 h-3" /> },
  };

  const totalCost = items.filter(i => i.status === 'active').reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="bg-primary text-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">قائمة الأماني</h1>
            <p className="text-white/80 text-sm">خطط لمشترياتك المستقبلية</p>
          </div>
          <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="bg-white text-primary hover:bg-gray-100">
            <Plus className="w-5 h-5 ml-2" />
            إضافة عنصر
          </Button>
        </div>
      </div>
      
      <div className="px-4 -mt-4 space-y-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">التكلفة الإجمالية المتبقية</p>
            <h2 className="text-3xl font-bold text-primary">
              {totalCost.toLocaleString()} ج.م
            </h2>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center dark:text-gray-300">جاري تحميل قائمة الأماني...</p>
        ) : items.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">قائمتك فارغة حالياً</p>
              <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="bg-primary">
                <Plus className="w-4 h-4 ml-2" />
                ابدأ بإضافة عنصر
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className={`shadow-sm ${item.status === 'purchased' ? 'bg-gray-100 opacity-70 dark:bg-gray-800/70' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${priorityMap[item.priority].color}`}>
                      {priorityMap[item.priority].icon}
                    </div>
                    <div>
                      <p className={`font-semibold text-gray-900 dark:text-gray-100 ${item.status === 'purchased' ? 'line-through' : ''}`}>{item.name}</p>
                      <p className="text-primary font-bold">{item.price.toLocaleString()} ج.م</p>
                      <Badge variant="outline" className={`mt-1 text-xs ${priorityMap[item.priority].color} dark:border-opacity-50`}>
                        {priorityMap[item.priority].label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'active' && (
                        <Button variant="ghost" size="icon" onClick={() => handleMarkAsPurchased(item)} className="text-green-500 hover:bg-green-100 dark:hover:bg-green-500/10">
                          <ShoppingCart className="w-5 h-5" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsFormOpen(true); }} className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingItemId(item.id)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingItem(null); }}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">{editingItem ? 'تعديل عنصر' : 'إضافة عنصر جديد'}</DialogTitle>
          </DialogHeader>
          <form key={editingItem?.id ?? 'new'} onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-300">اسم العنصر</Label>
              <Input id="name" name="name" defaultValue={editingItem?.name} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <div>
              <Label htmlFor="price" className="dark:text-gray-300">السعر</Label>
              <Input id="price" name="price" type="number" defaultValue={editingItem?.price} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <div>
              <Label htmlFor="priority" className="dark:text-gray-300">الأولوية</Label>
              <Select name="priority" defaultValue={editingItem?.priority || 'medium'}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="link" className="dark:text-gray-300">الرابط (اختياري)</Label>
              <Input id="link" name="link" defaultValue={editingItem?.link} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            </div>
             <div>
              <Label htmlFor="notes" className="dark:text-gray-300">ملاحظات (اختياري)</Label>
              <Input id="notes" name="notes" defaultValue={editingItem?.notes} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <Button type="submit" className="w-full bg-primary">{editingItem ? 'حفظ التغييرات' : 'إضافة'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItemId} onOpenChange={(open) => { if (!open) setDeletingItemId(null); }}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">حذف العنصر</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deletingItemId)} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
