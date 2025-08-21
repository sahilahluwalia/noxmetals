'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase/client';
import Header from '../../components/Header';
import { QuotesArraySchema, type Quote } from '../../utils/schemas/quoteSchemas';

// Quote type is now imported from schemas

export default function QuotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fetchQuotes = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingQuotes(true);
      setError(null);
      setValidationErrors([]);
      
      // Using singleton supabase instance
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Validate the response data with Zod
      const validationResult = QuotesArraySchema.safeParse(data || []);
      
      if (!validationResult.success) {
        console.error('Data validation errors:', validationResult.error.issues);
        const errorMessages = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        setValidationErrors(errorMessages);
        setError('Data validation failed. Some quote data may be corrupted.');
        return;
      }
      
      setQuotes(validationResult.data);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quotes. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingQuotes(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
    
    if (user) {
      fetchQuotes();
    }
  }, [user, loading, router, fetchQuotes]);

  const openQuoteDetails = (quote: Quote) => {
    try {
      // Additional validation before opening modal
      const isValidQuote = quote && quote.id && quote.full_name && quote.email;
      
      if (!isValidQuote) {
        console.error('Invalid quote data:', quote);
        setError('Unable to display quote details. Quote data appears to be corrupted.');
        return;
      }
      
      setSelectedQuote(quote);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error opening quote details:', err);
      setError('Failed to open quote details. Please try again.');
    }
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
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  const formatDimensions = (length: number, width: number, height: number) => {
    try {
      const l = isNaN(length) ? 0 : length;
      const w = isNaN(width) ? 0 : width;
      const h = isNaN(height) ? 0 : height;
      return `${l}" × ${w}" × ${h}"`;
    } catch (err) {
      console.error('Error formatting dimensions:', err);
      return 'Invalid dimensions';
    }
  };

  const formatMaterial = (material: string) => {
    try {
      if (!material || typeof material !== 'string') return 'Unknown material';
      return material.charAt(0).toUpperCase() + material.slice(1).replace('-', ' ');
    } catch (err) {
      console.error('Error formatting material:', err);
      return 'Unknown material';
    }
  };

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

  if (!user) {
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
              onClick={() => router.back()}
              className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Your Quote History 📋</h1>
                <p className="text-gray-400 text-lg">
                  View all your submitted quote requests and their current status
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/submit-quote')}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Submit New Quote
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium mb-1">Error Loading Quotes</h4>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-yellow-200 font-medium mb-2">Data Validation Issues</h4>
                  <ul className="list-disc list-inside text-yellow-200 text-sm space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-300 mt-2">
                    Some quote data may not display correctly. Please contact support if this persists.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quotes List */}
          {loadingQuotes ? (
            <div className="space-y-6">
              {/* Loading Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-20 mx-auto"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading Quotes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    {/* Loading Quote Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="animate-pulse">
                          <div className="h-5 bg-gray-700 rounded mb-2 w-3/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-700 rounded-full w-20"></div>
                      </div>
                    </div>

                    {/* Loading Quote Details */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="animate-pulse">
                          <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
                          <div className="h-4 bg-gray-700 rounded w-24"></div>
                        </div>
                        <div className="animate-pulse">
                          <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
                          <div className="h-4 bg-gray-700 rounded w-20"></div>
                        </div>
                      </div>
                      
                      <div className="animate-pulse">
                        <div className="h-3 bg-gray-700 rounded w-24 mb-1"></div>
                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                      </div>
                      
                      <div className="animate-pulse">
                        <div className="h-3 bg-gray-700 rounded w-32 mb-1"></div>
                        <div className="h-4 bg-gray-700 rounded w-40"></div>
                      </div>
                    </div>

                    {/* Loading Quote Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
                      <div className="animate-pulse">
                        <div className="h-3 bg-gray-700 rounded w-32"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-20"></div>
                        </div>
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No quotes yet</h3>
              <p className="text-gray-400 mb-6">
                You haven&apos;t submitted any quote requests yet. Start by submitting your first quote!
              </p>
              <button
                onClick={() => router.push('/dashboard/submit-quote')}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Submit Your First Quote
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{quotes.length}</div>
                  <div className="text-sm text-gray-400">Total Quotes</div>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {quotes.filter(q => q.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-400">Pending</div>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {quotes.filter(q => q.status === 'approved').length}
                  </div>
                  <div className="text-sm text-gray-400">Approved</div>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {quotes.filter(q => q.status === 'in_progress').length}
                  </div>
                  <div className="text-sm text-gray-400">In Progress</div>
                </div>
              </div>

              {/* Quotes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {quotes.map((quote) => (
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
                      
                      {quote.additional_notes && (
                        <div>
                          <span className="text-gray-400 text-sm">Notes:</span>
                          <p className="text-white text-sm line-clamp-2">{quote.additional_notes}</p>
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
                          <button className="text-gray-400 hover:text-gray-300 text-sm transition-colors">
                            Edit
                          </button>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

              {/* Additional Notes */}
              {selectedQuote.additional_notes && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">Additional Notes</h3>
                  <p className="text-white leading-relaxed">{selectedQuote.additional_notes}</p>
                </div>
              )}

              {/* Submission Info */}
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">Submission Information</h3>
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
                  <button className="w-full sm:w-auto px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                    Edit Quote
                  </button>
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
