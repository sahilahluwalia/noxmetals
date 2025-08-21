import { User, Session } from '@supabase/supabase-js';

// Storage keys
const SESSION_KEY = 'nox_auth_session';
const USER_KEY = 'nox_auth_user';
const ROLE_KEY = 'nox_auth_role';
const TIMESTAMP_KEY = 'nox_auth_timestamp';

// Cache expiry time (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

interface CachedAuthData {
  user: User | null;
  session: Session | null;
  userRole: {
    id: string;
    user_id: string;
    role: 'user' | 'admin' | 'super_admin';
    created_at: string;
    updated_at: string;
  } | null;
  timestamp: number;
}

// SSR-safe localStorage utilities
const isClient = typeof window !== 'undefined';

export const sessionStorage = {
  // Check if cached data is still valid
  isValid(): boolean {
    if (!isClient) return false;
    
    try {
      const timestamp = localStorage.getItem(TIMESTAMP_KEY);
      if (!timestamp) return false;
      
      const age = Date.now() - parseInt(timestamp, 10);
      return age < CACHE_EXPIRY_MS;
    } catch (error) {
      console.warn('Error checking cache validity:', error);
      return false;
    }
  },

  // Get cached auth data
  get(): CachedAuthData | null {
    if (!isClient) return null;
    
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      const roleStr = localStorage.getItem(ROLE_KEY);
      const timestampStr = localStorage.getItem(TIMESTAMP_KEY);
      
      if (!timestampStr) return null;
      
      // Check if cache is expired
      const timestamp = parseInt(timestampStr, 10);
      const age = Date.now() - timestamp;
      
      if (age > CACHE_EXPIRY_MS) {
        this.clear();
        return null;
      }
      
      return {
        session: sessionStr ? JSON.parse(sessionStr) : null,
        user: userStr ? JSON.parse(userStr) : null,
        userRole: roleStr ? JSON.parse(roleStr) : null,
        timestamp
      };
    } catch (error) {
      console.warn('Error reading from session cache:', error);
      this.clear(); // Clear corrupted data
      return null;
    }
  },

  // Store auth data in cache
  set(data: Omit<CachedAuthData, 'timestamp'>): void {
    if (!isClient) return;
    
    try {
      const timestamp = Date.now();
      
      if (data.session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
      
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
      
      if (data.userRole) {
        localStorage.setItem(ROLE_KEY, JSON.stringify(data.userRole));
      } else {
        localStorage.removeItem(ROLE_KEY);
      }
      
      localStorage.setItem(TIMESTAMP_KEY, timestamp.toString());
    } catch (error) {
      console.warn('Error writing to session cache:', error);
      // If storage is full or fails, clear it
      this.clear();
    }
  },

  // Clear all cached auth data
  clear(): void {
    if (!isClient) return;
    
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Error clearing session cache:', error);
    }
  },

  // Update just the user role without affecting session/user
  updateRole(userRole: CachedAuthData['userRole']): void {
    if (!isClient) return;
    
    try {
      if (userRole) {
        localStorage.setItem(ROLE_KEY, JSON.stringify(userRole));
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
      } else {
        localStorage.removeItem(ROLE_KEY);
      }
    } catch (error) {
      console.warn('Error updating role cache:', error);
    }
  }
};
