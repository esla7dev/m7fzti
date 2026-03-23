import { supabase } from '@/api/supabaseClient';

export const categoryService = {
  /** Fetch all custom categories for a user. */
  async getAll(userId) {
    try {
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /** Create a new custom category. */
  async create(userId, { name, emoji }) {
    try {
      const { data, error } = await supabase
        .from('user_categories')
        .insert({ user_id: userId, name: name.trim(), emoji: emoji || '📁' })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  /** Update name/emoji of an existing custom category (scoped to user). */
  async update(userId, id, { name, emoji }) {
    try {
      const { data, error } = await supabase
        .from('user_categories')
        .update({ name: name.trim(), emoji: emoji || '📁' })
        .eq('id', id)
        .eq('user_id', userId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  /**
   * Count how many transactions + budgets reference this category key.
   * Used to block deletion when the category is still in use.
   */
  async checkUsage(userId, categoryKey) {
    try {
      const [txResult, budgetResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('category', categoryKey),
        supabase
          .from('budgets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('category', categoryKey),
      ]);

      return (txResult.count ?? 0) + (budgetResult.count ?? 0);
    } catch (error) {
      console.error('Error checking category usage:', error);
      return 0;
    }
  },

  /** Delete a custom category by id (scoped to user). Callers must check usage first. */
  async delete(userId, id) {
    try {
      const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },
};

