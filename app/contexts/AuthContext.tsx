'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { sessionStorage } from '../utils/sessionStorage';

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
      // Update localStorage cache with the cached role
      sessionStorage.updateRole(cached);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      let role;
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        role = {
          id: '',
          user_id: userId,
          role: 'user' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        role = data || {
          id: '',
          user_id: userId,
          role: 'user' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      setUserRole(role);
      roleCache.set(userId, role);
      // Update localStorage cache with fresh role
      sessionStorage.updateRole(role);
      
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
      sessionStorage.updateRole(defaultRole);
    }
  }, [supabase, roleCache]);

  useEffect(() => {
    let mounted = true;

    const loadCachedData = () => {
      // Try to load cached data immediately for instant UI
      const cached = sessionStorage.get();
      if (cached && sessionStorage.isValid() && mounted) {
        console.log('Loading cached auth data');
        setUser(cached.user);
        setSession(cached.session);
        setUserRole(cached.userRole);
        setLoading(false);
        setInitialLoadComplete(true);
        
        // Cache the role if available
        if (cached.user && cached.userRole) {
          roleCache.set(cached.user.id, cached.userRole);
        }
        
        return true; // Cached data loaded
      }
      return false; // No valid cache
    };

    const refreshAuthData = async () => {
      try {
        console.log('Refreshing auth data from server');
        // Get fresh session data from server
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        const user = session?.user ?? null;
        setUser(user);
        setSession(session);

        let userRole = null;
        if (user) {
          await fetchUserRole(user.id);
          // fetchUserRole updates the state, so we need to get it from cache after
          const roleFromCache = roleCache.get(user.id);
          userRole = roleFromCache || null;
        } else {
          setUserRole(null);
        }

        // Update localStorage cache with fresh data
        sessionStorage.set({
          user,
          session,
          userRole: user ? roleCache.get(user.id) || null : null
        });

      } catch (error) {
        console.error('Error refreshing auth data:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setUserRole(null);
          sessionStorage.clear(); // Clear corrupted cache
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    // 1. First try to load cached data for instant UI
    const hasCachedData = loadCachedData();

    // 2. Always refresh in background to keep data fresh
    refreshAuthData();

    // ✅ Handle all relevant auth events including initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || isSigningOut) return;

        // ✅ Handle initial session - crucial for SSR hydration
        if (event === 'INITIAL_SESSION') {
          const user = session?.user ?? null;
          setUser(user);
          setSession(session);
          if (user) {
            await fetchUserRole(user.id);
            // Update cache after role fetch
            sessionStorage.set({
              user,
              session,
              userRole: roleCache.get(user.id) || null
            });
          } else {
            setUserRole(null);
            sessionStorage.set({ user: null, session: null, userRole: null });
          }
          setLoading(false);
          setInitialLoadComplete(true);
        } else if (event === 'SIGNED_IN') {
          const user = session?.user ?? null;
          setUser(user);
          setSession(session);
          if (user) {
            await fetchUserRole(user.id);
            // Update cache after successful sign in
            sessionStorage.set({
              user,
              session,
              userRole: roleCache.get(user.id) || null
            });
          } else {
            setUserRole(null);
            sessionStorage.set({ user: null, session: null, userRole: null });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setUserRole(null);
          // Clear both memory and localStorage cache on sign out
          roleCache.clear();
          sessionStorage.clear();
        } else if (event === 'TOKEN_REFRESHED') {
          // ✅ Just update session, don't refetch role
          const user = session?.user ?? null;
          setSession(session);
          setUser(user);
          // Update cache with refreshed session
          if (user) {
            sessionStorage.set({
              user,
              session,
              userRole: roleCache.get(user.id) || null
            });
          }
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
      // Clear localStorage cache
      sessionStorage.clear();
      
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
      // Don't clear cache if there was an unexpected error
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
