'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '../components/Header';
import { supabase } from '../utils/supabase/client';
import Link from 'next/link';

interface QuoteStats {
  total_quotes: number;
  pending_quotes: number;
  approved_quotes: number;
  rejected_quotes: number;
  in_progress_quotes: number;
}

interface MultilineRfqStats {
  total_rfqs: number;
  pending_rfqs: number;
  approved_rfqs: number;
  rejected_rfqs: number;
  in_progress_rfqs: number;
}

export default function DashboardPage() {
  const { user, loading, isAdmin, userRole } = useAuth();
  const router = useRouter();
  const [quoteStats, setQuoteStats] = useState<QuoteStats>({
    total_quotes: 0,
    pending_quotes: 0,
    approved_quotes: 0,
    rejected_quotes: 0,
    in_progress_quotes: 0
  });
  const [multilineRfqStats, setMultilineRfqStats] = useState<MultilineRfqStats>({
    total_rfqs: 0,
    pending_rfqs: 0,
    approved_rfqs: 0,
    rejected_rfqs: 0,
    in_progress_rfqs: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchQuoteStats = useCallback(async () => {

    if (!user || isAdmin) {
      console.log('No user or admin');
      return;
    };
    
    setStatsLoading(true);
    try {
      // Using singleton supabase instance
      
      // Get quote statistics
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('status')
        .eq('user_id', user.id);

      if (quotesError) throw quotesError;
      
      const stats = {
        total_quotes: quotes?.length || 0,
        pending_quotes: quotes?.filter(q => q.status === 'pending').length || 0,
        approved_quotes: quotes?.filter(q => q.status === 'approved').length || 0,
        rejected_quotes: quotes?.filter(q => q.status === 'rejected').length || 0,
        in_progress_quotes: quotes?.filter(q => q.status === 'in_progress').length || 0
      };
      
      setQuoteStats(stats);

      // Get multi-line RFQ statistics
      const { data: rfqs, error: rfqsError } = await supabase
        .from('multiline_rfqs')
        .select('status')
        .eq('user_id', user.id);

      if (rfqsError) {
        console.error('Error fetching RFQ stats:', rfqsError);
      } else {
        const rfqStats = {
          total_rfqs: rfqs?.length || 0,
          pending_rfqs: rfqs?.filter(r => r.status === 'pending').length || 0,
          approved_rfqs: rfqs?.filter(r => r.status === 'approved').length || 0,
          rejected_rfqs: rfqs?.filter(r => r.status === 'rejected').length || 0,
          in_progress_rfqs: rfqs?.filter(r => r.status === 'in_progress').length || 0
        };
        
        setMultilineRfqStats(rfqStats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    console.log('Dashboard useEffect - loading:', loading, 'user:', !!user, 'isAdmin:', isAdmin, 'userRole:', userRole);
    
    // Don't do anything while still loading
    if (loading) {
      return;
    }
    
    // Redirect to auth if no user
    if (!user) {
      router.push('/auth');
      return;
    }
    
    // Redirect to admin dashboard if user is admin
    if (isAdmin) {
      console.log('User is admin, redirecting to admin dashboard');
      router.push('/admin/dashboard');
      return;
    }
  }, [user, loading, isAdmin, userRole, router]);

  // Separate effect for fetching quote stats to avoid dependency issues
  useEffect(() => {
    if (!loading && user && !isAdmin) {
      fetchQuoteStats();
    }
  }, [user, loading, isAdmin, fetchQuoteStats]);

  

  if (!user || isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="relative z-10 pt-20 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Welcome back, {user.user_metadata?.full_name || user.email}! 🎉
            </h1>
            <p className="text-gray-400 text-lg">
              Access your manufacturing portal dashboard
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                
                <h3 className="text-xl font-semibold">Quick Actions</h3>
              </div>
              <div className="space-y-6">
                {/* Quotes Section */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Quotes</div>
                  <div className="space-y-3">
                    <Link
                      href="/dashboard/submit-quote"
                      className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Submit New Quote
                    </Link>
                    <Link
                      href="/dashboard/quotes"
                      className="w-full cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Show Past Quotes
                    </Link>
                  </div>
                </div>

                {/* Multi-Line RFQ Section */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Multi-Line RFQ</div>
                  <div className="space-y-3">
                    <Link
                      href="/dashboard/multiline-rfq"
                      className="w-full cursor-pointer bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Multi-Line RFQ
                    </Link>
                    <Link
                      href="/dashboard/rfq-history"
                      className="w-full cursor-pointer bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Multi-Line RFQ History
                    </Link>
                  </div>
                </div>

                {/* Support Section */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Support</div>
                  <Link
                    href="/dashboard/contact-support"
                    className="w-full cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Account Info</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <p className="text-white">{user.user_metadata?.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <span className="text-gray-400">Company:</span>
                  <p className="text-white">{user.user_metadata?.company || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Member since:</span>
                  <p className="text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Account Summary Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Account Summary</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Account Status: Active</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  <span>Quotes Submitted: {quoteStats.total_quotes}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  <span>Pending Quotes: {quoteStats.pending_quotes}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Approved Quotes: {quoteStats.approved_quotes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quote & RFQ Summary Cards */}
          {(statsLoading || quoteStats.total_quotes > 0 || multilineRfqStats.total_rfqs > 0) && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6">Quote Overview</h2>
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center animate-pulse">
                      <div className="h-8 bg-gray-700/50 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700/30 rounded mx-auto w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Regular Quotes */}
                  {quoteStats.total_quotes > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-blue-400">Regular Quotes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-blue-400">{quoteStats.total_quotes}</div>
                          <div className="text-sm text-gray-400">Total Quotes</div>
                        </div>
                        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-yellow-400">{quoteStats.pending_quotes}</div>
                          <div className="text-sm text-gray-400">Pending Review</div>
                        </div>
                        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-green-400">{quoteStats.approved_quotes}</div>
                          <div className="text-sm text-gray-400">Approved</div>
                        </div>
                        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-blue-400">{quoteStats.in_progress_quotes}</div>
                          <div className="text-sm text-gray-400">In Progress</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Multi-Line RFQs */}
                  {multilineRfqStats.total_rfqs > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-purple-400 flex items-center gap-2">
                        Multi-Line RFQs
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-700/30 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-purple-400">{multilineRfqStats.total_rfqs}</div>
                          <div className="text-sm text-gray-400">Total RFQs</div>
                        </div>
                        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-700/30 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-yellow-400">{multilineRfqStats.pending_rfqs}</div>
                          <div className="text-sm text-gray-400">Pending Review</div>
                        </div>
                        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-700/30 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-green-400">{multilineRfqStats.approved_rfqs}</div>
                          <div className="text-sm text-gray-400">Approved</div>
                        </div>
                        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-700/30 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-purple-400">{multilineRfqStats.in_progress_rfqs}</div>
                          <div className="text-sm text-gray-400">In Progress</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 bg-blue-900/30 border border-blue-700/50 rounded-xl p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
                <p className="text-blue-200 text-sm">
                  Your account is protected by Supabase&apos;s enterprise-grade security. 
                  All authentication data is encrypted and stored securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
