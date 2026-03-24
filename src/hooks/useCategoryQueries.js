import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { categoryService } from '@/api/services/categoryService';
import { toast } from 'sonner';

/**
 * Returns the full merged category list: built-in defaults first, then the
 * user's custom categories.  Each item has the shape { key, label, emoji }.
 * For custom categories `key` is the UUID row id stored in the DB.
 */
export function useAllCategories(userId) {
  const { data: custom = [] } = useQuery({
    queryKey: QUERY_KEYS.categories(userId),
    queryFn: () => categoryService.getAll(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  return useMemo(() => {
    const customMapped = custom.map(c => ({ key: c.id, label: c.name, emoji: c.emoji }));
    return [...DEFAULT_CATEGORIES, ...customMapped];
  }, [custom]);
}

/** Raw hook that exposes the query result (for mutation invalidation checks). */
export function useCustomCategories(userId) {
  return useQuery({
    queryKey: QUERY_KEYS.categories(userId),
    queryFn: () => categoryService.getAll(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddCategory(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {{ name: string, emoji: string }} */ data) => categoryService.create(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories(userId) });
      toast.success('تم إضافة الفئة بنجاح');
    },
    onError: (err) => {
      console.error('Error adding category:', err);
      toast.error('حدث خطأ أثناء إضافة الفئة');
    },
  });
}

export function useUpdateCategory(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {{ id: string, name: string, emoji: string }} */ { id, ...rest }) => categoryService.update(userId, id, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories(userId) });
      toast.success('تم تحديث الفئة بنجاح');
    },
    onError: (err) => {
      console.error('Error updating category:', err);
      toast.error('حدث خطأ أثناء تحديث الفئة');
    },
  });
}

export function useDeleteCategory(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId) => {
      const usageCount = await categoryService.checkUsage(userId, categoryId);
      if (usageCount > 0) {
        throw new Error(`لا يمكن حذف هذه الفئة — تُستخدم في ${usageCount} معاملة/ميزانية`);
      }
      return categoryService.delete(userId, categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories(userId) });
      toast.success('تم حذف الفئة بنجاح');
    },
    onError: (err) => {
      console.error('Error deleting category:', err);
      toast.error(err.message || 'حدث خطأ أثناء حذف الفئة');
    },
  });
}
