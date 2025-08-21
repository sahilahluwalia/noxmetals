'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  // Using singleton supabase instance
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
          setTimeout(() => router.push('/auth'), 3000);
          return;
        }

        if (data.session) {
          // Check if user is admin and redirect accordingly
          try {
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', data.session.user.id)
              .single();

            if (roleError && roleError.code !== 'PGRST116') {
              console.error('Error fetching user role:', roleError);
            }

            const userRole = roleData?.role || 'user';
            
            if (userRole === 'admin' || userRole === 'super_admin') {
              // Admin user - redirect to admin dashboard
              router.push('/admin/dashboard');
            } else {
              // Regular user - redirect to user dashboard
              router.push('/dashboard');
            }
          } catch (roleErr) {
            console.error('Error checking user role:', roleErr);
            // Default to user dashboard if role check fails
            router.push('/dashboard');
          }
        } else {
          // No session found, redirect to login
          router.push('/auth');
        }
      } catch (err) {
        setError('An unexpected error occurred during authentication.');
        setTimeout(() => router.push('/auth'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-6 mb-4">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <p className="text-sm text-gray-400">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
