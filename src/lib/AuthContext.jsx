import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { userSettingsService } from '@/api/services/userSettingsService'
import { toast } from 'sonner'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'ar',
  primary_color: '#10b981',
  secondary_color: '#065f46',
  accent_color: '#34d399',
  notifications_enabled: true,
  budget_alerts: true,
  default_currency: 'EGP',
  large_transaction_threshold: 5000
};

// Ensure user row exists in public.users table (required by FK constraints)
const ensurePublicUser = async (authUser) => {
  try {
    const { error } = await supabase
      .from('users')
      .upsert({ id: authUser.id, email: authUser.email }, { onConflict: 'id' });
    if (error) {
      console.warn('ensurePublicUser:', error.message);
    }
  } catch { /* non-fatal */ }
};

// Load or create settings, always returns an object
const loadSettings = async (userId) => {
  try {
    const settings = await userSettingsService.get(userId);
    return settings || DEFAULT_SETTINGS;
  } catch {
    try {
      return await userSettingsService.createDefault(userId);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userSettings, setUserSettings] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const initialCheckDone = useRef(false)

  // Check authentication status on mount
  useEffect(() => {
    // Safety net: if auth check hangs for any reason, unblock the UI after 15 s
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 15000)

    const checkAuth = async () => {
      try {
        setIsLoading(true)
        setAuthError(null)

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (session?.user) {
          setUser(session.user)
          setIsAuthenticated(true)

          await ensurePublicUser(session.user)
          const settings = await loadSettings(session.user.id)
          setUserSettings(settings)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setAuthError({
          type: 'unknown',
          message: error.message || 'Authentication error'
        })
      } finally {
        initialCheckDone.current = true
        clearTimeout(loadingTimeout)
        setIsLoading(false)
      }
    }

    checkAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip if initial check hasn't finished yet to avoid race condition
      if (!initialCheckDone.current) return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setIsAuthenticated(true)
        setAuthError(null)

        await ensurePublicUser(session.user)
        const settings = await loadSettings(session.user.id)
        setUserSettings(settings)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAuthenticated(false)
        setUserSettings(null)
      }
    })

    return () => {
      clearTimeout(loadingTimeout)
      subscription?.unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setIsAuthenticated(false)
      setUserSettings(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error logging out')
    }
  }

  const updateSettings = async (newSettings) => {
    try {
      if (!user) throw new Error('No user logged in')

      const updated = await userSettingsService.update(user.id, newSettings)
      setUserSettings(updated)
      toast.success('Settings updated')
      return updated
    } catch (error) {
      console.error('Settings update error:', error)
      toast.error('Error updating settings')
      throw error
    }
  }

  const value = {
    user,
    userSettings,
    isAuthenticated,
    isLoading,
    authError,
    logout,
    updateSettings
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
