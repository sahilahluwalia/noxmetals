'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';

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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
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

  // Add a timeout mechanism to prevent infinite loading in production
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !isSigningOut) {
        console.warn('Auth loading timeout - forcing loading to false. This might indicate a production auth issue.');
        setLoading(false);
      }
    }, 15000); // 15 second timeout for production

    return () => clearTimeout(timeout);
  }, [loading, isSigningOut]);

  useEffect(() => {
    // Get initial user with retry logic for production
    const getInitialUser = async (retryCount = 0) => {
      const maxRetries = 3;
      try {
        console.log('Getting initial user... (attempt', retryCount + 1, ')');
        
        // Add a small delay for production stability
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
          if (retryCount < maxRetries) {
            console.log('Retrying auth check...');
            return getInitialUser(retryCount + 1);
          }
        }
        
        console.log('Initial user retrieved:', !!user, user?.id);

        setSession(null);
        setUser(user ?? null);

        if (user) {
          console.log('User found, fetching role...');
          await fetchUserRole(user.id);
        } else {
          console.log('No user found');
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error getting initial user:', error);
        if (retryCount < maxRetries) {
          console.log('Retrying due to error...');
          return getInitialUser(retryCount + 1);
        }
      } finally {
        console.log('Initial user loading complete');
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        // Don't interfere with manual sign out process
        if (isSigningOut) {
          console.log('Auth state change ignored during sign out process');
          return;
        }

        console.log('Auth state change event:', event);
        
        // Only set loading for specific events to prevent infinite loading
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(true);
        }

        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) {
            console.error('Error getting user in auth state change:', error);
            // Don't update state if there's an error - keep current state
            return;
          }
          
          setSession(null);
          setUser(user ?? null);

          if (user) {
            await fetchUserRole(user.id);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setLoading(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserRole, isSigningOut]);

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      console.log('Starting sign out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setIsSigningOut(false);
        return;
      }
      
      // Clear local state immediately
      setUserRole(null);
      setUser(null);
      setSession(null);
      setLoading(false);
      
      console.log('Sign out successful, redirecting to auth page...');
      // Navigate to auth page
      router.push('/auth');
      
      // Reset sign out flag after a short delay to allow navigation
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      setIsSigningOut(false);
    }
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
  // But not during sign out process (we handle loading manually there)
  const isLoading = isSigningOut ? false : (loading || roleLoading);

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
