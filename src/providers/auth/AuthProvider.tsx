import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { createError } from '@/utils/core/error';
import { AuthContext } from './AuthContext';
import { User } from '@/types/user';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const updateUser = (user: User) => {
    setUser(user);
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        setLoading(true);
        setError(null);

        // Get initial session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (mounted) {
            setUser(session ? { id: 'anonymous', email: 'anonymous' } : null);
          }
        } catch (error) {
          console.warn('Failed to get initial session:', error);
          if (mounted) {
            setUser(null);
          }
        }

        // Listen for auth changes
        try {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_, session) => {
              if (mounted) {
                setUser(session ? { id: 'anonymous', email: 'anonymous' } : null);
              }
            }
          );

          return () => {
            mounted = false;
            subscription.unsubscribe();
          };
        } catch (error) {
          console.warn('Failed to set up auth state listener:', error);
          return () => {
            mounted = false;
          };
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Authentication failed'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (err) {
      setError(createError('SYSTEM_ERROR', 'Failed to sign in'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(createError('SYSTEM_ERROR', 'Failed to sign out'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}