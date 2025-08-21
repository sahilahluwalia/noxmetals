'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import AuthPageLayout, { SocialLoginButtons } from '../components/AuthPageLayout';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  // Using singleton supabase instance
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error parameter from callback
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_callback_error') {
      setError('Authentication failed. Please try again.');
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepSignedIn: false
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, isAdmin, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Successfully signed in - redirect will happen in useEffect
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
    finally{
      setAuthLoading(false); // Set loading to false regardless of success or error
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setAuthLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase() as 'google' | 'github' | 'linkedin',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setError(error.message);
        setAuthLoading(false);
      }
      // OAuth will redirect the user, so no need to handle navigation here
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setAuthLoading(false);
    }
  };

  // Show loading if checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if already authenticated
  if (user) {
    return null;
  }

  return (
    <AuthPageLayout error={error}>
      {/* Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="flex items-center text-sm font-medium mb-2">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            Email <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@company.com"
            required
            disabled={authLoading}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="flex items-center text-sm font-medium mb-2">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Password <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            required
            disabled={authLoading}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Keep me signed in */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="keepSignedIn"
            name="keepSignedIn"
            checked={formData.keepSignedIn}
            onChange={handleInputChange}
            disabled={authLoading}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="keepSignedIn" className="ml-2 text-sm text-gray-300">
            Keep me signed in
          </label>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={authLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {authLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-800 px-4 text-gray-400 uppercase tracking-wider text-xs">
              OR CONTINUE WITH
            </span>
          </div>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="mb-6">
        <SocialLoginButtons onSocialLogin={handleSocialLogin} loading={authLoading} />
      </div>

      {/* Bottom Links */}
      <div className="text-center space-y-4">
        <Link 
          href="/forgot-password" 
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
        >
          Forgot your password?
        </Link>
        
        <div className="text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link 
            href="/signup" 
            className="text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
          >
            Create one here
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  );
}
