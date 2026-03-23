import { supabase } from '@/api/supabaseClient';

export const notificationService = {
  async getAll(userId, { limit = 20, offset = 0 } = {}) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) return [];
      return data || [];
    } catch { return []; }
  },

  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) return 0;
      return count || 0;
    } catch { return 0; }
  },

  async create(userId, { type, title, message }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async delete(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    if (error) throw error;
  },

  async deleteAll(userId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  },
};
