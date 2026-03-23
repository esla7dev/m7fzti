import { supabase } from '@/api/supabaseClient';

export const wishlistService = {
  // Get all wishlist items for a user
  async getAll(userId) {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      throw error;
    }
  },

  // Get wishlist item by ID (scoped to user)
  async getById(userId, itemId) {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching wishlist item:', error);
      throw error;
    }
  },

  // Create a new wishlist item
  async create(userId, itemData) {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert([{ user_id: userId, ...itemData }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating wishlist item:', error);
      throw error;
    }
  },

  // Update a wishlist item (scoped to user)
  async update(userId, itemId, itemData) {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .update(itemData)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      throw error;
    }
  },

  // Delete a wishlist item (scoped to user)
  async delete(userId, itemId) {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
      throw error;
    }
  }
};
