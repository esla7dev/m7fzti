import { supabase } from '@/api/supabaseClient';

export const budgetService = {
  // Get all budgets for a user
  async getAll(userId) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }
  },

  // Get budget by ID (scoped to user)
  async getById(userId, budgetId) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
  },

  // Get budget by category
  async getByCategory(userId, category) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching budget by category:', error);
      throw error;
    }
  },

  // Create a new budget
  async create(userId, budgetData) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ user_id: userId, ...budgetData }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  },

  // Update a budget (scoped to user)
  async update(userId, budgetId, budgetData) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', budgetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  },

  // Delete a budget (scoped to user)
  async delete(userId, budgetId) {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  },
};
