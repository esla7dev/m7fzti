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

  // Get wishlist items by user ID
  async getWishlistByUser(userId) {
    return this.getAll(userId);
  },

  // Get wishlist item by ID
  async getById(itemId) {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('id', itemId)
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
        .insert([
          {
            user_id: userId,
            ...itemData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating wishlist item:', error);
      throw error;
    }
  },

  // Update a wishlist item
  async update(itemId, itemData) {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .update({
          ...itemData,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      throw error;
    }
  },

  // Delete a wishlist item
  async delete(itemId) {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
      throw error;
    }
  }
};
