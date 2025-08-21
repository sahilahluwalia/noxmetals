'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';
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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const router = useRouter();

  // ✅ Create client instance within component, not singleton
  const supabase = useMemo(() => createClient(), []);

  // ✅ Add role caching to reduce database calls
  const roleCache = useMemo(() => new Map<string, UserRole>(), []);

  const fetchUserRole = useCallback(async (userId: string) => {
    // Check cache first
    const cached = roleCache.get(userId);
    if (cached) {
      setUserRole(cached);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        const defaultRole = {
          id: '',
          user_id: userId,
          role: 'user' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUserRole(defaultRole);
        roleCache.set(userId, defaultRole);
      } else {
        const role = data || {
          id: '',
          user_id: userId,
          role: 'user' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUserRole(role);
        roleCache.set(userId, role);
      }
    } catch (err) {
      // Set fallback role without excessive logging in production
      const defaultRole = {
        id: '',
        user_id: userId,
        role: 'user' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUserRole(defaultRole);
      roleCache.set(userId, defaultRole);
    }
  }, [supabase, roleCache]);

  useEffect(() => {
    let mounted = true;

    const getInitialAuth = async () => {
      try {
        // Get session first, then extract user from it
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        const user = session?.user ?? null;
        setUser(user);
        setSession(session);

        if (user) {
          await fetchUserRole(user.id);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setSession(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    getInitialAuth();

    // ✅ Handle all relevant auth events including initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || isSigningOut) return;

        // ✅ Handle initial session - crucial for SSR hydration
        if (event === 'INITIAL_SESSION') {
          setUser(session?.user ?? null);
          setSession(session);
          if (session?.user) {
            await fetchUserRole(session.user.id);
          } else {
            setUserRole(null);
          }
          setLoading(false);
          setInitialLoadComplete(true);
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
          setSession(session);
          if (session?.user) {
            await fetchUserRole(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setUserRole(null);
          // Clear role cache on sign out
          roleCache.clear();
        } else if (event === 'TOKEN_REFRESHED') {
          // ✅ Just update session, don't refetch role
          setSession(session);
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole, isSigningOut, supabase, roleCache]);

  // ✅ Add timeout mechanism to prevent infinite loading states
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !initialLoadComplete && !isSigningOut) {
        console.warn('Auth loading timeout reached, forcing load complete');
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [loading, initialLoadComplete, isSigningOut]);

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
      setInitialLoadComplete(true);
      roleCache.clear();
      
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

  // ✅ Optimized loading state for better SSR/hydration experience
  const isLoading = isSigningOut ? false : (loading && !initialLoadComplete);

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
