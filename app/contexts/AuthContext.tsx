'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase/client';

interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

interface UpdateUserData {
  full_name?: string;
  company?: string;
  phone?: string;
  [key: string]: string | undefined;
}

interface UpdateUserResponse {
  data: User | null;
  error: Error | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  updateUser: (attributes: { data: UpdateUserData }) => Promise<UpdateUserResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  // Using singleton supabase instance

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      setRoleLoading(true);
      console.log('Fetching user role for userId:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();
      console.log('User role data:', data);
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching user role:', error);
        // Set default role as 'user' if no role found
        const defaultRole = {
          id: '',
          user_id: userId,
          role: 'user' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUserRole(defaultRole);
        console.log('Set default user role:', defaultRole);
      } else {
        const role = data || {
          id: '',
          user_id: userId,
          role: 'user' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUserRole(role);
        console.log('Set user role from database:', role);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      const defaultRole = {
        id: '',
        user_id: userId,
        role: 'user' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUserRole(defaultRole);
      console.log('Set fallback user role:', defaultRole);
    } finally {
      setRoleLoading(false);
    }
  }, []);

  // Add a timeout mechanism to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session retrieved:', !!session, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User found, fetching role...');
          await fetchUserRole(session.user.id);
        } else {
          console.log('No user found in session');
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        console.log('Initial session loading complete');
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true); // Set loading while processing auth change
        
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserRole(session.user.id);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const updateUser = async (attributes: { data: UpdateUserData }): Promise<UpdateUserResponse> => {
    try {
      const result = await supabase.auth.updateUser(attributes);
      
      // If successful, update local user state
      if (result.data?.user) {
        setUser(result.data.user);
      }
      
      return {
        data: result.data?.user || null,
        error: result.error
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  };

  const isAdmin = userRole?.role === 'admin' || userRole?.role === 'super_admin';
  const isSuperAdmin = userRole?.role === 'super_admin';

  // Combine loading states: still loading if either session or role is loading
  const isLoading = loading || roleLoading;

  const value = {
    user,
    session,
    loading: isLoading,
    userRole,
    isAdmin,
    isSuperAdmin,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
