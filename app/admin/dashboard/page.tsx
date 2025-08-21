'use client';

import { useState, useEffect, useCallback } from 'react';
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
  user_metadata: Record<string, unknown>;
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
  total_multiline_rfqs: number;
  pending_multiline_rfqs: number;
  approved_multiline_rfqs: number;
  rejected_multiline_rfqs: number;
  in_progress_multiline_rfqs: number;
}

interface AdminMultilineRFQ {
  id: string;
  user_id: string;
  full_name: string;
  company: string;
  email: string;
  phone: string | null;
  additional_notes: string | null;
  dfars_required: boolean;
  rohs_compliant: boolean;
  status: string;
  total_pieces: number;
  total_items: number;
  created_at: string;
  updated_at: string;
  user_email: string;
  raw_user_meta_data: Record<string, unknown> | null;
  user_role: string | null;
  items_count: number;
  total_quantity: number;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  user_metadata: Record<string, unknown>;
  role: 'user' | 'admin' | 'super_admin';
  role_created_at: string | null;
  role_updated_at: string | null;
  app_metadata: Record<string, unknown>;
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
  
  // User management state
  const [activeTab, setActiveTab] = useState<'quotes' | 'multiline-rfqs' | 'users'>('quotes');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

  // Multi-line RFQ management state
  const [multilineRfqs, setMultilineRfqs] = useState<AdminMultilineRFQ[]>([]);
  const [loadingMultilineRfqs, setLoadingMultilineRfqs] = useState(true);
  const [selectedMultilineRfq, setSelectedMultilineRfq] = useState<AdminMultilineRFQ | null>(null);
  const [selectedMultilineRfqWithItems, setSelectedMultilineRfqWithItems] = useState<any>(null);
  const [showMultilineRfqDetailsModal, setShowMultilineRfqDetailsModal] = useState(false);
  const [loadingMultilineRfqDetails, setLoadingMultilineRfqDetails] = useState(false);
  const [multilineRfqFilterStatus, setMultilineRfqFilterStatus] = useState<string>('all');
  const [multilineRfqSearchTerm, setMultilineRfqSearchTerm] = useState<string>('');
  const [updatingMultilineRfq, setUpdatingMultilineRfq] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoadingQuotes(true);
      // Using singleton supabase instance
      
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
  }, [user, isAdmin]);

  const fetchStats = useCallback(async () => {
    if (!user || !isAdmin) return;
    
    try {
      // Using singleton supabase instance
      
      const { data, error } = await supabase
        .rpc('get_admin_dashboard_stats');

      if (error) throw error;
      
      setStats(data?.[0] || null);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [user, isAdmin]);

  const fetchUsers = useCallback(async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoadingUsers(true);

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setLoadingUsers(false);
    }
  }, [user, isAdmin]);

  const fetchMultilineRfqs = useCallback(async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoadingMultilineRfqs(true);
      
      const { data, error } = await supabase
        .from('admin_multiline_rfqs_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMultilineRfqs(data || []);
    } catch (err) {
      console.error('Error fetching multiline RFQs:', err);
      setError('Failed to load multi-line RFQs. Please try again.');
    } finally {
      setLoadingMultilineRfqs(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    } else if (!loading && user && !isAdmin) {
      router.push('/dashboard');
    }
    
    if (user && isAdmin) {
      fetchQuotes();
      fetchMultilineRfqs();
      fetchStats();
      if (activeTab === 'users') {
        fetchUsers();
      }
    }
  }, [user, loading, isAdmin, router, fetchQuotes, fetchMultilineRfqs, fetchStats, fetchUsers, activeTab]);

  const sendQuoteStatusEmail = async (quote: AdminQuote, newStatus: string) => {
    try {
      const response = await fetch('/api/send-quote-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          status: newStatus,
          customerEmail: quote.user_email,
          customerName: quote.full_name,
          material: quote.material,
          quantity: quote.quantity,
          dimensions: `${quote.length}" × ${quote.width}" × ${quote.height}"`,
          company: quote.company,
          isMultilineRfq: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Email sending failed:', errorData);
        // Don't throw error here as the quote status update should still proceed
      } else {
        console.log('Email sent successfully for quote:', quote.id);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw error here as the quote status update should still proceed
    }
  };

  const sendMultilineRfqStatusEmail = async (rfq: AdminMultilineRFQ, newStatus: string) => {
    try {
      const response = await fetch('/api/send-quote-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: rfq.id,
          status: newStatus,
          customerEmail: rfq.user_email,
          customerName: rfq.full_name,
          company: rfq.company,
          rejectionReason: newStatus === 'rejected' ? 'Unable to fulfill multi-line RFQ at this time.' : undefined,
          isMultilineRfq: true,
          totalItems: rfq.total_items,
          totalPieces: rfq.total_pieces,
          dfarsRequired: rfq.dfars_required,
          rohsCompliant: rfq.rohs_compliant
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Multi-line RFQ email sending failed:', errorData);
        // Don't throw error here as the RFQ status update should still proceed
      } else {
        console.log('Multi-line RFQ email sent successfully:', rfq.id);
      }
    } catch (error) {
      console.error('Error sending multi-line RFQ email:', error);
      // Don't throw error here as the RFQ status update should still proceed
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    if (!user || !isAdmin) return;
    
    try {
      setUpdatingQuote(quoteId);
      // Using singleton supabase instance
      
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) throw error;
      
      // Find the quote for email sending
      const quote = quotes.find(q => q.id === quoteId);
      
      // Send email notification if status is approved or rejected
      if (quote && (newStatus === 'approved' || newStatus === 'rejected')) {
        await sendQuoteStatusEmail(quote, newStatus);
      }
      
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

  // User management helper functions
  const openUserDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const closeUserDetails = () => {
    setShowUserDetailsModal(false);
    setSelectedUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'bg-purple-600';
      case 'admin':
        return 'bg-blue-600';
      case 'user':
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleText = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'user':
      default:
        return 'User';
    }
  };

  const handleTabSwitch = (tab: 'quotes' | 'multiline-rfqs' | 'users') => {
    setActiveTab(tab);
    if (tab === 'users' && users.length === 0) {
      fetchUsers();
    }
    if (tab === 'multiline-rfqs' && multilineRfqs.length === 0) {
      fetchMultilineRfqs();
    }
  };

  const handleUpdateMultilineRfqStatus = async (rfqId: string, newStatus: string) => {
    try {
      setUpdatingMultilineRfq(rfqId);
      
      const { error } = await supabase
        .from('multiline_rfqs')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', rfqId);

      if (error) throw error;
      
      // Find the RFQ for email sending
      const rfq = multilineRfqs.find(r => r.id === rfqId);
      
      // Send email notification if status is approved or rejected
      if (rfq && (newStatus === 'approved' || newStatus === 'rejected')) {
        await sendMultilineRfqStatusEmail(rfq, newStatus);
      }
      
      // Update local state
      setMultilineRfqs(prev => prev.map(rfq => 
        rfq.id === rfqId ? { ...rfq, status: newStatus } : rfq
      ));
      
      // Refresh stats
      fetchStats();
      
      // Close modal if open
      if (selectedMultilineRfq?.id === rfqId) {
        closeMultilineRfqDetails();
      }
    } catch (err) {
      console.error('Error updating multi-line RFQ status:', err);
      setError('Failed to update multi-line RFQ status. Please try again.');
    } finally {
      setUpdatingMultilineRfq(null);
    }
  };

  const openMultilineRfqDetails = async (rfq: AdminMultilineRFQ) => {
    setSelectedMultilineRfq(rfq);
    setShowMultilineRfqDetailsModal(true);
    setLoadingMultilineRfqDetails(true);
    
    try {
      // Fetch detailed RFQ with items using the database function
      const { data, error } = await supabase
        .rpc('get_multiline_rfq_with_items', { rfq_uuid: rfq.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSelectedMultilineRfqWithItems(data[0]);
      }
    } catch (err) {
      console.error('Error fetching RFQ details:', err);
      setError('Failed to load RFQ details. Please try again.');
    } finally {
      setLoadingMultilineRfqDetails(false);
    }
  };

  const closeMultilineRfqDetails = () => {
    setShowMultilineRfqDetailsModal(false);
    setSelectedMultilineRfq(null);
    setSelectedMultilineRfqWithItems(null);
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

  // Filter users based on role and search term
  const filteredUsers = users.filter(user => {
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
    const company = typeof user.user_metadata?.company === 'string' ? user.user_metadata.company : '';
    const matchesSearch = userSearchTerm === '' || 
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      company.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    return matchesRole && matchesSearch;
  });

  // Filter multi-line RFQs based on status and search term
  const filteredMultilineRfqs = multilineRfqs.filter(rfq => {
    const matchesStatus = multilineRfqFilterStatus === 'all' || rfq.status === multilineRfqFilterStatus;
    const matchesSearch = multilineRfqSearchTerm === '' || 
      rfq.full_name.toLowerCase().includes(multilineRfqSearchTerm.toLowerCase()) ||
      rfq.company.toLowerCase().includes(multilineRfqSearchTerm.toLowerCase()) ||
      rfq.user_email.toLowerCase().includes(multilineRfqSearchTerm.toLowerCase());
    
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
           
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Admin Dashboard 👑</h1>
                <p className="text-gray-400 text-lg">
                  Manage all quote requests and user accounts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium">
                  Admin Access
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-6">
              <div className="flex space-x-1 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1">
                <button
                  onClick={() => handleTabSwitch('quotes')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'quotes'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Quote Management
                  </span>
                </button>
                <button
                  onClick={() => handleTabSwitch('multiline-rfqs')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'multiline-rfqs'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-sm">🚀</span>
                    Multi-Line RFQs
                  </span>
                </button>
                <button
                  onClick={() => handleTabSwitch('users')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    User Management
                  </span>
                </button>
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.total_quotes}</div>
                <div className="text-sm text-gray-400">Total Quotes</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.total_multiline_rfqs || 0}</div>
                <div className="text-sm text-gray-400">Multi-Line RFQs</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{(stats.pending_quotes || 0) + (stats.pending_multiline_rfqs || 0)}</div>
                <div className="text-sm text-gray-400">Pending Review</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{(stats.approved_quotes || 0) + (stats.approved_multiline_rfqs || 0)}</div>
                <div className="text-sm text-gray-400">Approved</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{(stats.in_progress_quotes || 0) + (stats.in_progress_multiline_rfqs || 0)}</div>
                <div className="text-sm text-gray-400">In Progress</div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-400">{stats.total_users}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
            </div>
          )}

          {/* Quote Management Content */}
          {activeTab === 'quotes' && (
            <>
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
                  <div key={quote.id} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 flex flex-col h-full">
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
                    <div className="space-y-3 mb-4 flex-grow">
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-700/50 mt-auto">
                      <span className="text-xs text-gray-400 order-2 sm:order-1">
                        Submitted {formatDate(quote.created_at)}
                      </span>
                      <div className="flex flex-wrap gap-2 order-1 sm:order-2 w-full sm:w-auto">
                        <button 
                          onClick={() => openQuoteDetails(quote)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                        >
                          <span className="flex items-center justify-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </span>
                        </button>
                        {quote.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateQuoteStatus(quote.id, 'approved')}
                              disabled={updatingQuote === quote.id}
                              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              <span className="flex items-center justify-center gap-1">
                                {updatingQuote === quote.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Approve
                                  </>
                                )}
                              </span>
                            </button>
                            <button 
                              onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                              disabled={updatingQuote === quote.id}
                              className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              <span className="flex items-center justify-center gap-1">
                                {updatingQuote === quote.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reject
                                  </>
                                )}
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}

          {/* Multi-line RFQ Management Content */}
          {activeTab === 'multiline-rfqs' && (
            <>
              {/* Multi-line RFQ Filters and Search */}
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Search Multi-Line RFQs</label>
                    <input
                      type="text"
                      placeholder="Search by name, company, or email..."
                      value={multilineRfqSearchTerm}
                      onChange={(e) => setMultilineRfqSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Filter by Status</label>
                    <select
                      value={multilineRfqFilterStatus}
                      onChange={(e) => setMultilineRfqFilterStatus(e.target.value)}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              {/* Multi-line RFQ List */}
              {loadingMultilineRfqs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading multi-line RFQs...</p>
                </div>
              ) : filteredMultilineRfqs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Multi-Line RFQs found</h3>
                  <p className="text-gray-400">
                    {multilineRfqSearchTerm || multilineRfqFilterStatus !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No multi-line RFQs have been submitted yet.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Multi-line RFQ Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredMultilineRfqs.map((rfq) => (
                      <div key={rfq.id} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 flex flex-col h-full">
                        {/* RFQ Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">🚀</span>
                              <h3 className="text-lg font-semibold">Multi-Line RFQ</h3>
                            </div>
                            <p className="text-sm text-gray-400">
                              {rfq.total_items} item{rfq.total_items !== 1 ? 's' : ''} • {rfq.total_pieces} total piece{rfq.total_pieces !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(rfq.status)}`}>
                            {getStatusText(rfq.status)}
                          </span>
                        </div>

                        {/* RFQ Details */}
                        <div className="space-y-3 mb-4 flex-grow">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Company:</span>
                              <p className="text-white">{rfq.company}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Contact:</span>
                              <p className="text-white">{rfq.full_name}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">User Email:</span>
                              <p className="text-white break-all">{rfq.user_email}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">User Role:</span>
                              <p className="text-white capitalize">{rfq.user_role || 'user'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            {rfq.dfars_required && (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                <span className="text-blue-400">DFARS</span>
                              </div>
                            )}
                            {rfq.rohs_compliant && (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <span className="text-green-400">RoHS</span>
                              </div>
                            )}
                          </div>

                          {rfq.additional_notes && (
                            <div>
                              <span className="text-gray-400 text-sm">Notes:</span>
                              <p className="text-white text-sm truncate">{rfq.additional_notes}</p>
                            </div>
                          )}
                        </div>

                        {/* RFQ Footer */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-700/50 mt-auto">
                          <span className="text-xs text-gray-400 order-2 sm:order-1">
                            Submitted {formatDate(rfq.created_at)}
                          </span>
                          <div className="flex flex-wrap gap-2 order-1 sm:order-2 w-full sm:w-auto">
                            <button 
                              onClick={() => openMultilineRfqDetails(rfq)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                            >
                              <span className="flex items-center justify-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Details
                              </span>
                            </button>

                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdateMultilineRfqStatus(rfq.id, 'approved')}
                                disabled={updatingMultilineRfq === rfq.id}
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingMultilineRfq === rfq.id ? 'Updating...' : 'Approve'}
                              </button>
                              <button 
                                onClick={() => handleUpdateMultilineRfqStatus(rfq.id, 'rejected')}
                                disabled={updatingMultilineRfq === rfq.id}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingMultilineRfq === rfq.id ? 'Updating...' : 'Reject'}
                              </button>
                              <button 
                                onClick={() => handleUpdateMultilineRfqStatus(rfq.id, 'in_progress')}
                                disabled={updatingMultilineRfq === rfq.id}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingMultilineRfq === rfq.id ? 'Updating...' : 'In Progress'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* User Management Content */}
          {activeTab === 'users' && (
            <>
              {/* User Filters and Search */}
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Search Users</label>
                    <input
                      type="text"
                      placeholder="Search by email, name, or company..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Filter by Role</label>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">Users</option>
                      <option value="admin">Admins</option>
                      <option value="super_admin">Super Admins</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users List */}
              {loadingUsers ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No users found</h3>
                  <p className="text-gray-400">
                    {userSearchTerm || userRoleFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No users are registered yet.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Users Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 flex flex-col h-full">
                        {/* User Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1 truncate">
                              {(typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) || 'No Name'}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(user.role)} ml-2 flex-shrink-0`}>
                            {getRoleText(user.role)}
                          </span>
                        </div>

                        {/* User Details */}
                        <div className="space-y-3 mb-4 flex-grow">
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            {typeof user.user_metadata?.company === 'string' && user.user_metadata.company && (
                              <div>
                                <span className="text-gray-400">Company:</span>
                                <p className="text-white truncate">{user.user_metadata.company}</p>
                              </div>
                            )}
                            
                            <div>
                              <span className="text-gray-400">Status:</span>
                              <p className={`text-sm ${user.email_confirmed_at ? 'text-green-400' : 'text-yellow-400'}`}>
                                {user.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                              </p>
                            </div>
                            
                            {user.last_sign_in_at && (
                              <div>
                                <span className="text-gray-400">Last Login:</span>
                                <p className="text-white text-sm">{formatDate(user.last_sign_in_at)}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* User Footer */}
                        <div className="flex flex-col gap-3 pt-4 border-t border-gray-700/50 mt-auto">
                          <span className="text-xs text-gray-400">
                            Joined {formatDate(user.created_at)}
                          </span>
                          <button 
                            onClick={() => openUserDetails(user)}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                          >
                            <span className="flex items-center justify-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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
              <div className="flex flex-col sm:flex-row gap-3 justify-end items-stretch sm:items-center">
                {selectedQuote.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateQuoteStatus(selectedQuote.id, 'approved')}
                      disabled={updatingQuote === selectedQuote.id}
                      className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {updatingQuote === selectedQuote.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve Quote
                          </>
                        )}
                      </span>
                    </button>
                    <button 
                      onClick={() => updateQuoteStatus(selectedQuote.id, 'rejected')}
                      disabled={updatingQuote === selectedQuote.id}
                      className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {updatingQuote === selectedQuote.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject Quote
                          </>
                        )}
                      </span>
                    </button>
                  </>
                )}
                <button
                  onClick={closeQuoteDetails}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    User Details 👤
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getRoleColor(selectedUser.role)}`}>
                      {getRoleText(selectedUser.role)}
                    </span>
                    <span className="text-sm text-gray-400">
                      ID: {selectedUser.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeUserDetails}
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
              {/* Basic Information */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-green-400">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Full Name:</span>
                    <p className="text-white font-medium">{(typeof selectedUser.user_metadata?.full_name === 'string' ? selectedUser.user_metadata.full_name : null) || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Email:</span>
                    <p className="text-white font-medium break-all">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Phone:</span>
                    <p className="text-white font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Company:</span>
                    <p className="text-white font-medium">{(typeof selectedUser.user_metadata?.company === 'string' ? selectedUser.user_metadata.company : null) || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">Account Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Email Verified:</span>
                    <p className={`font-medium ${selectedUser.email_confirmed_at ? 'text-green-400' : 'text-yellow-400'}`}>
                      {selectedUser.email_confirmed_at ? 'Yes' : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Role:</span>
                    <p className="text-white font-medium">{getRoleText(selectedUser.role)}</p>
                  </div>
                  {selectedUser.last_sign_in_at && (
                    <div>
                      <span className="text-gray-400 text-sm">Last Login:</span>
                      <p className="text-white font-medium">{formatDate(selectedUser.last_sign_in_at)}</p>
                    </div>
                  )}
                </div>
                
                {selectedUser.email_confirmed_at && (
                  <div className="mt-4">
                    <span className="text-gray-400 text-sm">Email Confirmed:</span>
                    <p className="text-white font-medium">{formatDate(selectedUser.email_confirmed_at)}</p>
                  </div>
                )}
              </div>

              {/* Registration Information */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">Registration Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Joined:</span>
                    <p className="text-white font-medium">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  {selectedUser.role_created_at && (
                    <div>
                      <span className="text-gray-400 text-sm">Role Assigned:</span>
                      <p className="text-white font-medium">{formatDate(selectedUser.role_created_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Metadata */}
              {Object.keys(selectedUser.user_metadata || {}).length > 0 && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">Additional Information</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedUser.user_metadata || {}).map(([key, value]) => (
                      key !== 'full_name' && key !== 'company' && (
                        <div key={key} className="flex justify-between items-start">
                          <span className="text-gray-400 text-sm capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-white text-sm ml-4 text-right">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700/50 p-6 rounded-b-2xl">
              <div className="flex justify-end">
                <button
                  onClick={closeUserDetails}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-line RFQ Details Modal */}
      {showMultilineRfqDetailsModal && selectedMultilineRfq && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>🚀</span>
                  Multi-Line RFQ Details
                </h2>
                <p className="text-gray-400 mt-1">
                  {selectedMultilineRfq.total_items} items • {selectedMultilineRfq.total_pieces} total pieces
                </p>
              </div>
              <button
                onClick={closeMultilineRfqDetails}
                className="text-gray-400 hover:text-white p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* RFQ Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Name:</span> <span className="text-white ml-2">{selectedMultilineRfq.full_name}</span></div>
                    <div><span className="text-gray-400">Company:</span> <span className="text-white ml-2">{selectedMultilineRfq.company}</span></div>
                    <div><span className="text-gray-400">Email:</span> <span className="text-white ml-2">{selectedMultilineRfq.email}</span></div>
                    <div><span className="text-gray-400">Phone:</span> <span className="text-white ml-2">{selectedMultilineRfq.phone || 'Not provided'}</span></div>
                    <div><span className="text-gray-400">User Email:</span> <span className="text-white ml-2">{selectedMultilineRfq.user_email}</span></div>
                  </div>
                </div>

                {/* RFQ Details */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">RFQ Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedMultilineRfq.status)}`}>
                        {getStatusText(selectedMultilineRfq.status)}
                      </span>
                    </div>
                    <div><span className="text-gray-400">Total Items:</span> <span className="text-white ml-2">{selectedMultilineRfq.total_items}</span></div>
                    <div><span className="text-gray-400">Total Pieces:</span> <span className="text-white ml-2">{selectedMultilineRfq.total_pieces}</span></div>
                    <div><span className="text-gray-400">Submitted:</span> <span className="text-white ml-2">{formatDate(selectedMultilineRfq.created_at)}</span></div>
                    <div><span className="text-gray-400">Last Updated:</span> <span className="text-white ml-2">{formatDate(selectedMultilineRfq.updated_at)}</span></div>
                  </div>
                </div>
              </div>

              {/* Compliance & Notes */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Compliance & Requirements</h3>
                <div className="flex items-center gap-4 mb-3">
                  {selectedMultilineRfq.dfars_required && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span className="text-blue-400 text-sm">DFARS Required</span>
                    </div>
                  )}
                  {selectedMultilineRfq.rohs_compliant && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="text-green-400 text-sm">RoHS Compliant</span>
                    </div>
                  )}
                </div>
                {selectedMultilineRfq.additional_notes && (
                  <div>
                    <span className="text-gray-400 text-sm">Additional Notes:</span>
                    <p className="text-white mt-1 p-3 bg-gray-800/50 rounded text-sm whitespace-pre-wrap">{selectedMultilineRfq.additional_notes}</p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">RFQ Items ({selectedMultilineRfq.total_items})</h3>
                
                {loadingMultilineRfqDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading item details...</p>
                  </div>
                ) : selectedMultilineRfqWithItems?.items && selectedMultilineRfqWithItems.items.length > 0 ? (
                  <div className="space-y-4">
                    {selectedMultilineRfqWithItems.items.map((item: any, index: number) => (
                      <div key={item.id} className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-medium">
                                Item #{index + 1}
                              </span>
                              <h4 className="font-semibold text-lg">
                                {(() => {
                                  const materialMap: { [key: string]: string } = {
                                    '6061-t6': '6061-T6 Aluminum',
                                    '7075-t6': '7075-T6 Aluminum', 
                                    '5000-series': '5000 Series Aluminum',
                                    '7050-t7451': '7050-T7451 Aluminum',
                                    'p20-tool-steel': 'P20 Tool Steel',
                                    'other': 'Other Material'
                                  };
                                  return materialMap[item.material] || item.material;
                                })()}
                              </h4>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                              <div className="bg-gray-700/50 p-2 rounded">
                                <span className="text-gray-400 text-xs">Length</span>
                                <p className="text-white font-medium">{item.length}"</p>
                              </div>
                              <div className="bg-gray-700/50 p-2 rounded">
                                <span className="text-gray-400 text-xs">Width</span>
                                <p className="text-white font-medium">{item.width}"</p>
                              </div>
                              <div className="bg-gray-700/50 p-2 rounded">
                                <span className="text-gray-400 text-xs">Height</span>
                                <p className="text-white font-medium">{item.height}"</p>
                              </div>
                              <div className="bg-gray-700/50 p-2 rounded">
                                <span className="text-gray-400 text-xs">Quantity</span>
                                <p className="text-white font-medium">{item.quantity} pcs</p>
                              </div>
                            </div>
                            
                            {item.material_spec && (
                              <div className="mb-2">
                                <span className="text-gray-400 text-xs">Material Specification:</span>
                                <p className="text-white text-sm">{item.material_spec}</p>
                              </div>
                            )}
                            
                            {item.description && (
                              <div>
                                <span className="text-gray-400 text-xs">Description:</span>
                                <p className="text-white text-sm">{item.description}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Dimensions</div>
                            <div className="text-white font-medium">
                              {item.length}" × {item.width}" × {item.height}"
                            </div>
                            <div className="text-purple-400 font-semibold mt-1">
                              {item.quantity} piece{item.quantity !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Summary */}
                    <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4 mt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-purple-200">RFQ Summary</h4>
                          <p className="text-purple-300 text-sm">
                            {selectedMultilineRfqWithItems.items.length} unique item{selectedMultilineRfqWithItems.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-200">
                            {selectedMultilineRfqWithItems.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                          </div>
                          <div className="text-purple-300 text-sm">Total Pieces</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p>No items found for this RFQ</p>
                    <p className="text-sm mt-1">({selectedMultilineRfq.total_pieces} total pieces expected)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleUpdateMultilineRfqStatus(selectedMultilineRfq.id, 'approved')}
                  disabled={updatingMultilineRfq === selectedMultilineRfq.id}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingMultilineRfq === selectedMultilineRfq.id ? 'Updating...' : 'Approve RFQ'}
                </button>
                <button 
                  onClick={() => handleUpdateMultilineRfqStatus(selectedMultilineRfq.id, 'rejected')}
                  disabled={updatingMultilineRfq === selectedMultilineRfq.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingMultilineRfq === selectedMultilineRfq.id ? 'Updating...' : 'Reject RFQ'}
                </button>
                <button 
                  onClick={() => handleUpdateMultilineRfqStatus(selectedMultilineRfq.id, 'in_progress')}
                  disabled={updatingMultilineRfq === selectedMultilineRfq.id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingMultilineRfq === selectedMultilineRfq.id ? 'Updating...' : 'Mark In Progress'}
                </button>
              </div>
              <button
                onClick={closeMultilineRfqDetails}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
