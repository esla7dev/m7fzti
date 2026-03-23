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

  // Get budgets by user ID
  async getBudgetsByUser(userId) {
    return this.getAll(userId);
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

  // Get budget by ID
  async getById(budgetId) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
  },

  // Create a new budget
  async create(userId, budgetData) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([
          {
            user_id: userId,
            ...budgetData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  },

  // Update a budget
  async update(budgetId, budgetData) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          ...budgetData,
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  },

  // Delete a budget
  async delete(budgetId) {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  },

  // Update spent amount
  async updateSpent(budgetId, spentAmount) {
    return this.update(budgetId, { spent_amount: spentAmount });
  }
};
