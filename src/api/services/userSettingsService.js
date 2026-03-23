import { supabase } from '@/api/supabaseClient';

export const userSettingsService = {
  // Get user settings — auto-creates defaults if none exist
  async get(userId) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      // No row found — create defaults
      if (!data) {
        return this.createDefault(userId);
      }

      return data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  // Get user settings
  async getUserSettings(userId) {
    return this.get(userId);
  },

  // Create user settings
  async create(userId, settingsData) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: userId,
            ...settingsData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw error;
    }
  },

  // Create default user settings (includes all fields)
  async createDefault(userId) {
    return this.create(userId, {
      theme: 'light',
      language: 'ar',
      primary_color: '#10b981',
      secondary_color: '#065f46',
      accent_color: '#34d399',
      notifications_enabled: true,
      budget_alerts: true,
      default_currency: 'EGP'
    });
  },

  // Create user settings
  async createUserSettings(settingsData) {
    return this.create(settingsData.user_id, settingsData);
  },

  // Update user settings
  async update(userId, settingsData) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...settingsData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }
};
