import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseCredentials } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  isPasswordResetFlow: boolean;
  setIsPasswordResetFlow: (val: boolean) => void;
  signUp: (email: string, password: string, fullName: string, businessName: string, businessType: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  checkConfiguration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(() => getSupabaseCredentials().isConfigured);
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState<boolean>(false);

  const checkConfiguration = () => {
    const creds = getSupabaseCredentials();
    setIsConfigured(creds.isConfigured);
  };

  const fetchProfile = async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching profile from Supabase:', error.message);
      }

      if (data) {
        const loadedProfile: UserProfile = {
          ...(data as UserProfile),
          plan: (data.plan === 'PRO' ? 'PRO' : 'FREE'),
        };
        setProfile(loadedProfile);
        return loadedProfile;
      } else {
        // Create a default profile if not exists
        const defaultProf: UserProfile = {
          id: userId,
          full_name: user?.user_metadata?.full_name || '',
          email: userEmail || user?.email || '',
          phone: '',
          business_name: user?.user_metadata?.business_name || 'আমার ব্যবসা (My Business)',
          business_type: user?.user_metadata?.business_type || 'Retail',
          plan: 'FREE',
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .upsert(defaultProf)
          .select()
          .single();

        if (!insertError && inserted) {
          const loadedProfile: UserProfile = {
            ...(inserted as UserProfile),
            plan: (inserted.plan === 'PRO' ? 'PRO' : 'FREE'),
          };
          setProfile(loadedProfile);
          return loadedProfile;
        } else {
          setProfile(defaultProf);
          return defaultProf;
        }
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return null;
    }
  };

  useEffect(() => {
    checkConfiguration();
    const creds = getSupabaseCredentials();
    if (!creds.isConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check for password recovery in URL hash
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsPasswordResetFlow(true);
    }

    // Initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id, currentSession.user.email).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordResetFlow(true);
      }

      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    businessName: string,
    businessType: string
  ): Promise<{ error: string | null }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Supabase credentials are not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.' };
    }

    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            business_type: businessType,
          },
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && data.session) {
        // Create or upsert profile when session is directly available
        const newProf: UserProfile = {
          id: data.user.id,
          full_name: fullName,
          email: cleanEmail,
          phone: '',
          business_name: businessName,
          business_type: businessType,
        };
        try {
          await supabase.from('profiles').upsert(newProf);
          setProfile(newProf);
        } catch {
          // Handled by database trigger or subsequent login
        }
      }

      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      return { error: message };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Supabase credentials are not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.' };
    }

    try {
      const cleanEmail = email.trim();
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return {
            error: 'ভুল ইমেইল বা পাসওয়ার্ড অথবা এই অ্যাকাউন্টের অস্তিত্ব নেই (Invalid login credentials. If using the demo account, please register/sign up first or create it in your Supabase Auth dashboard).'
          };
        }
        if (error.message.includes('Email not confirmed')) {
          return {
            error: 'ইমেইল ভেরিফাই করা হয়নি (Email not confirmed. Please check your inbox or disable "Confirm email" in Supabase Auth settings).'
          };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { error: message };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Supabase is not configured' };
    }

    try {
      const cleanEmail = email.trim();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      return { error: message };
    }
  };

  const updatePassword = async (password: string): Promise<{ error: string | null }> => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase is not configured' };

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      setIsPasswordResetFlow(false);
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password update failed';
      return { error: message };
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<{ error: string | null }> => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      // SECURITY: User plan can never be elevated directly through frontend updateProfile
      // Only authorized administrative/database procedures or approved payment requests can change plan.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { plan: _ignoredPlan, ...safeData } = data;

      const updated = {
        ...safeData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updated)
        .eq('id', user.id);

      if (error) return { error: error.message };

      setProfile((prev) => (prev ? { ...prev, ...updated } : null));
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      return { error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        isPasswordResetFlow,
        setIsPasswordResetFlow,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshProfile,
        checkConfiguration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
