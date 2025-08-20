'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import Header from '../../components/Header';

interface AdminQuote {
  id: string;
  created_at: string;
  full_name: string;
  company: string;
  email: string;
  phone: string;
  length: number;
  width: number;
  height: number;
  material: string;
  quantity: number;
  material_spec: string;
  dfars_required: boolean;
  additional_notes: string;
  status: string;
  user_email: string;
  user_metadata: any;
  user_role: string;
}

interface AdminStats {
  total_quotes: number;
  pending_quotes: number;
  approved_quotes: number;
  rejected_quotes: number;
  in_progress_quotes: number;
  total_users: number;
  admin_users: number;
}

export default function AdminDashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<AdminQuote | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingQuote, setUpdatingQuote] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    } else if (!loading && user && !isAdmin) {
      router.push('/dashboard');
    }
    
    if (user && isAdmin) {
      fetchQuotes();
      fetchStats();
    }
  }, [user, loading, isAdmin, router]);

  const fetchQuotes = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoadingQuotes(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('admin_quotes_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setQuotes(data || []);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to load quotes. Please try again.');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const fetchStats = async () => {
    if (!user || !isAdmin) return;
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_admin_dashboard_stats');

      if (error) throw error;
      
      setStats(data?.[0] || null);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    if (!user || !isAdmin) return;
    
    try {
      setUpdatingQuote(quoteId);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) throw error;
      
      // Update local state
      setQuotes(prev => prev.map(q => 
        q.id === quoteId ? { ...q, status: newStatus } : q
      ));
      
      // Refresh stats
      fetchStats();
      
      // Close modal if open
      if (selectedQuote?.id === quoteId) {
        closeQuoteDetails();
      }
    } catch (err) {
      console.error('Error updating quote status:', err);
      setError('Failed to update quote status. Please try again.');
    } finally {
      setUpdatingQuote(null);
    }
  };

  const openQuoteDetails = (quote: AdminQuote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  const closeQuoteDetails = () => {
    setShowDetailsModal(false);
    setSelectedQuote(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-600';
      case 'approved':
        return 'bg-green-600';
      case 'rejected':
        return 'bg-red-600';
      case 'in_progress':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'in_progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDimensions = (length: number, width: number, height: number) => {
    return `${length}" × ${width}" × ${height}"`;
  };

  const formatMaterial = (material: string) => {
    return material.charAt(0).toUpperCase() + material.slice(1).replace('-', ' ');
  };

  // Filter quotes based on status and search term
  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      quote.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.material.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

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

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="relative z-10 pt-20 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Admin Dashboard 👑</h1>
                <p className="text-gray-400 text-lg">
                  Manage all quote requests and user submissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium">
                  Admin Access
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Admin Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.total_quotes}</div>
                <div className="text-sm text-gray-400">Total Quotes</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.pending_quotes}</div>
                <div className="text-sm text-gray-400">Pending Review</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.approved_quotes}</div>
                <div className="text-sm text-gray-400">Approved</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.total_users}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">Search Quotes</label>
                <input
                  type="text"
                  placeholder="Search by name, company, email, or material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quotes List */}
          {loadingQuotes ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading quotes...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No quotes found</h3>
              <p className="text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No quotes have been submitted yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quotes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredQuotes.map((quote) => (
                  <div key={quote.id} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    {/* Quote Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          {formatMaterial(quote.material)}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {quote.quantity} piece{quote.quantity > 1 ? 's' : ''} • {formatDimensions(quote.length, quote.width, quote.height)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(quote.status)}`}>
                        {getStatusText(quote.status)}
                      </span>
                    </div>

                    {/* Quote Details */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Company:</span>
                          <p className="text-white">{quote.company}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Contact:</span>
                          <p className="text-white">{quote.full_name}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">User Email:</span>
                          <p className="text-white break-all">{quote.user_email}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">User Role:</span>
                          <p className="text-white capitalize">{quote.user_role || 'user'}</p>
                        </div>
                      </div>
                      
                      {quote.material_spec && (
                        <div>
                          <span className="text-gray-400 text-sm">Specification:</span>
                          <p className="text-white text-sm">{quote.material_spec}</p>
                        </div>
                      )}
                      
                      {quote.dfars_required && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          <span className="text-sm text-blue-400">DFARS compliance required</span>
                        </div>
                      )}
                    </div>

                    {/* Quote Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
                      <span className="text-xs text-gray-400">
                        Submitted {formatDate(quote.created_at)}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openQuoteDetails(quote)}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors font-medium"
                        >
                          View Details
                        </button>
                        {quote.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateQuoteStatus(quote.id, 'approved')}
                              disabled={updatingQuote === quote.id}
                              className="text-green-400 hover:text-green-300 text-sm transition-colors font-medium disabled:opacity-50"
                            >
                              {updatingQuote === quote.id ? 'Updating...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                              disabled={updatingQuote === quote.id}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors font-medium disabled:opacity-50"
                            >
                              {updatingQuote === quote.id ? 'Updating...' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Quote Details Modal */}
      {showDetailsModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Quote Details 🔍
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(selectedQuote.status)}`}>
                      {getStatusText(selectedQuote.status)}
                    </span>
                    <span className="text-sm text-gray-400">
                      ID: {selectedQuote.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeQuoteDetails}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Material & Dimensions */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">Material & Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Material:</span>
                    <p className="text-white font-medium">{formatMaterial(selectedQuote.material)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Quantity:</span>
                    <p className="text-white font-medium">{selectedQuote.quantity} piece{selectedQuote.quantity > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Dimensions:</span>
                    <p className="text-white font-medium">{formatDimensions(selectedQuote.length, selectedQuote.width, selectedQuote.height)}</p>
                  </div>
                  {selectedQuote.material_spec && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 text-sm">Specifications:</span>
                      <p className="text-white font-medium">{selectedQuote.material_spec}</p>
                    </div>
                  )}
                  {selectedQuote.dfars_required && (
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-blue-400 font-medium">DFARS Compliance Required</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company & Contact */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-green-400">Company & Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Company:</span>
                    <p className="text-white font-medium">{selectedQuote.company}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Contact Person:</span>
                    <p className="text-white font-medium">{selectedQuote.full_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Email:</span>
                    <p className="text-white font-medium break-all">{selectedQuote.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Phone:</span>
                    <p className="text-white font-medium">{selectedQuote.phone}</p>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">User Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">User Email:</span>
                    <p className="text-white font-medium break-all">{selectedQuote.user_email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">User Role:</span>
                    <p className="text-white font-medium capitalize">{selectedQuote.user_role || 'user'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {selectedQuote.additional_notes && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">Additional Notes</h3>
                  <p className="text-white leading-relaxed">{selectedQuote.additional_notes}</p>
                </div>
              )}

              {/* Submission Info */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-indigo-400">Submission Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Submitted:</span>
                    <p className="text-white font-medium">{formatDate(selectedQuote.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Status:</span>
                    <p className="text-white font-medium">{getStatusText(selectedQuote.status)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700/50 p-6 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                {selectedQuote.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateQuoteStatus(selectedQuote.id, 'approved')}
                      disabled={updatingQuote === selectedQuote.id}
                      className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {updatingQuote === selectedQuote.id ? 'Updating...' : 'Approve Quote'}
                    </button>
                    <button 
                      onClick={() => updateQuoteStatus(selectedQuote.id, 'rejected')}
                      disabled={updatingQuote === selectedQuote.id}
                      className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {updatingQuote === selectedQuote.id ? 'Updating...' : 'Reject Quote'}
                    </button>
                  </>
                )}
                <button
                  onClick={closeQuoteDetails}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
