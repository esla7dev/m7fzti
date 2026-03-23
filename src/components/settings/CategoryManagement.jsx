// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Check, X, Tag } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import {
  useCustomCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useCategoryQueries';

export default function CategoryManagement({ userId }) {
  const { data: customCategories = [], isLoading } = useCustomCategories(userId);
  const addMutation    = useAddCategory(userId);
  const updateMutation = useUpdateCategory(userId);
  const deleteMutation = useDeleteCategory(userId);

  // State for the "add" form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmoji, setNewEmoji]       = useState('📁');
  const [newName, setNewName]         = useState('');

  // State for inline editing
  const [editingId, setEditingId]       = useState(null);
  const [editEmoji, setEditEmoji]       = useState('');
  const [editName, setEditName]         = useState('');

  // State for delete confirmation
  const [deletingCategory, setDeletingCategory] = useState(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addMutation.mutateAsync({ name: newName.trim(), emoji: newEmoji });
      setNewName('');
      setNewEmoji('📁');
      setShowAddForm(false);
    } catch {
      // error surfaced by onError toast
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditEmoji(cat.emoji);
    setEditName(cat.name);
  };

  const handleUpdate = async () => {
    if (!editName.trim() || !editingId) return;
    try {
      await updateMutation.mutateAsync({ id: editingId, name: editName.trim(), emoji: editEmoji });
      setEditingId(null);
    } catch {
      // error surfaced by onError toast
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
    } catch {
      // error surfaced by onError toast
    } finally {
      setDeletingCategory(null);
    }
  };

  return (
    <>
      <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center dark:bg-orange-900/50">
            <Tag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">إدارة الفئات</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">أضف فئات مخصصة تظهر في جميع أنحاء التطبيق</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Built-in (read-only) */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              الفئات الافتراضية
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map(cat => (
                <Badge
                  key={cat.key}
                  variant="secondary"
                  className="text-sm py-1 px-3 dark:bg-gray-700 dark:text-gray-300"
                >
                  {cat.emoji} {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom categories list */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              فئاتي المخصصة
            </p>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ) : customCategories.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
                لم تضف أي فئات مخصصة بعد.
              </p>
            ) : (
              <div className="space-y-2">
                {customCategories.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-2 rounded-lg border dark:border-gray-700"
                  >
                    {editingId === cat.id ? (
                      <>
                        <Input
                          value={editEmoji}
                          onChange={e => setEditEmoji(e.target.value)}
                          className="w-16 text-center dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                          maxLength={4}
                          placeholder="📁"
                        />
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                          placeholder="اسم الفئة"
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setEditingId(null); }}
                        />
                        <Button
                          size="icon"
                          className="h-8 w-8 bg-green-500 hover:bg-green-600 shrink-0"
                          onClick={handleUpdate}
                          disabled={updateMutation.isPending || !editName.trim()}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 dark:text-gray-400"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-xl w-8 text-center">{cat.emoji}</span>
                        <span className="flex-1 text-gray-800 dark:text-gray-200">{cat.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 dark:text-gray-400 dark:hover:bg-gray-700"
                          onClick={() => startEdit(cat)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-red-500 dark:hover:bg-red-500/10"
                          onClick={() => setDeletingCategory(cat)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add form */}
          {showAddForm ? (
            <div className="space-y-3 border dark:border-gray-700 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">فئة جديدة</p>
              <div className="flex gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">الرمز</Label>
                  <Input
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    className="w-16 text-center dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    maxLength={4}
                    placeholder="📁"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-gray-500">الاسم بالعربية</Label>
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="مثال: هدايا"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false); }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowAddForm(false); setNewName(''); setNewEmoji('📁'); }}
                  className="dark:text-gray-400"
                >
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={addMutation.isPending || !newName.trim()}
                  className="bg-primary"
                >
                  {addMutation.isPending ? 'جارٍ الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة فئة مخصصة
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">حذف الفئة</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              هل تريد حذف فئة "{deletingCategory?.name}"؟
              إذا كانت تُستخدم في معاملات أو ميزانيات، لن يتم حذفها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
