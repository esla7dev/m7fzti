import { supabase } from '@/api/supabaseClient';

export const transactionService = {
  // Get all transactions for a user, with optional server-side filters
  async getAll(userId, filters = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.wallet_id) query = query.eq('wallet_id', filters.wallet_id);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.startDate) query = query.gte('date', filters.startDate);
      if (filters.endDate) query = query.lte('date', filters.endDate);

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Get recent transactions for a user
  async getRecent(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  },

  // Get transactions by wallet ID
  async getByWallet(walletId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  },

  // Get transaction by ID (scoped to user)
  async getById(userId, transactionId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  },

  // Create a new transaction
  async create(userId, transactionData) {
    try {
      const row = {
        user_id: userId,
        title: transactionData.title,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category || null,
        wallet_id: transactionData.wallet_id,
        to_wallet_id: transactionData.to_wallet_id || null,
        date: transactionData.date || null,
        notes: transactionData.notes || null,
        recurring: transactionData.recurring || false,
        recurring_frequency: transactionData.recurring ? (transactionData.recurring_frequency || null) : null,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([row])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  // Update a transaction (scoped to user)
  async update(userId, transactionId, transactionData) {
    try {
      const row = {
        title: transactionData.title,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category || null,
        wallet_id: transactionData.wallet_id,
        to_wallet_id: transactionData.to_wallet_id || null,
        date: transactionData.date || null,
        notes: transactionData.notes || null,
        recurring: transactionData.recurring || false,
        recurring_frequency: transactionData.recurring ? (transactionData.recurring_frequency || null) : null,
      };

      const { data, error } = await supabase
        .from('transactions')
        .update(row)
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  // Delete a transaction (scoped to user)
  async delete(userId, transactionId) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  // Get transactions within a date range
  async getByDateRange(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions by date range:', error);
      throw error;
    }
  },

  // Get total amount for a category within a date range
  async getCategoryTotal(userId, category, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', category)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;
      return (data || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    } catch (error) {
      console.error('Error fetching category total:', error);
      throw error;
    }
  }
};
