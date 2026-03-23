import { supabase } from '@/api/supabaseClient';

export const walletService = {
  // Get all wallets for a user
  async getAll(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  },

  // Get wallet by ID
  async getById(walletId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }
  },

  // Get wallets by user ID
  async getWalletsByUser(userId) {
    return this.getAll(userId);
  },

  // Create a new wallet
  async create(userId, walletData) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([
          {
            user_id: userId,
            ...walletData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  },

  // Update a wallet
  async update(walletId, walletData) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .update({
          ...walletData,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  },

  // Delete a wallet
  async delete(walletId) {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', walletId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  },

  // Get total balance across all wallets for a user
  async getTotalBalance(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).reduce((sum, w) => sum + (w.balance || 0), 0);
    } catch (error) {
      console.error('Error fetching total balance:', error);
      throw error;
    }
  }
};
