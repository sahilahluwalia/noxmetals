'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import Header from '../../components/Header';

interface MultilineRFQItem {
  id: string;
  material: string;
  material_spec: string | null;
  length: number;
  width: number;
  height: number;
  quantity: number;
  description: string | null;
  created_at: string;
}

interface MultilineRFQ {
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
  items?: MultilineRFQItem[];
}

export default function RFQHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rfqs, setRfqs] = useState<MultilineRFQ[]>([]);
  const [loadingRfqs, setLoadingRfqs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRfq, setSelectedRfq] = useState<MultilineRFQ | null>(null);
  const [selectedRfqWithItems, setSelectedRfqWithItems] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchRFQs = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingRfqs(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('multiline_rfqs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('Fetched RFQs:', data);
      setRfqs(data || []);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load RFQs. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingRfqs(false);
    }
  }, [user]);

  const fetchRFQDetails = useCallback(async (rfqId: string) => {
    try {
      setLoadingDetails(true);
      
      const { data, error } = await supabase
        .rpc('get_multiline_rfq_with_items', { rfq_uuid: rfqId });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSelectedRfqWithItems(data[0]);
      }
    } catch (err) {
      console.error('Error fetching RFQ details:', err);
      setError('Failed to load RFQ details. Please try again.');
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
    
    if (user) {
      fetchRFQs();
    }
  }, [user, loading, router, fetchRFQs]);

  const openRfqDetails = async (rfq: MultilineRFQ) => {
    setSelectedRfq(rfq);
    setShowDetailsModal(true);
    await fetchRFQDetails(rfq.id);
  };

  const closeRfqDetails = () => {
    setShowDetailsModal(false);
    setSelectedRfq(null);
    setSelectedRfqWithItems(null);
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
      case 'completed':
        return 'bg-purple-600';
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
      case 'completed':
        return 'Completed';
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

  const getMaterialName = (materialValue: string) => {
    const materialMap: { [key: string]: string } = {
      '6061-t6': '6061-T6 Aluminum',
      '7075-t6': '7075-T6 Aluminum',
      '5000-series': '5000 Series Aluminum',
      '7050-t7451': '7050-T7451 Aluminum',
      'p20-tool-steel': 'P20 Tool Steel',
      'other': 'Other Material'
    };
    return materialMap[materialValue] || materialValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
            <h1 className="text-4xl font-bold mb-4">Your Multi-Line RFQ History 🚀</h1>
            <p className="text-gray-400 text-lg">
              View all your submitted multi-line RFQs and their current status
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/dashboard/multiline-rfq')}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              Submit New Multi-Line RFQ
            </button>
            <button
              onClick={() => router.push('/dashboard/quotes')}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              View Regular Quotes
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
              <h4 className="font-medium mb-1">Error Loading RFQs</h4>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* RFQs List */}
          {loadingRfqs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your multi-line RFQs...</p>
            </div>
          ) : rfqs.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Multi-Line RFQs Yet</h3>
              <p className="text-gray-400 mb-6">
                You haven't submitted any multi-line RFQs. Create your first comprehensive quote request!
              </p>
              <button
                onClick={() => router.push('/dashboard/multiline-rfq')}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <span>🚀</span>
                Submit Your First Multi-Line RFQ
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rfqs.map((rfq) => (
                  <div key={rfq.id} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-200">
                    {/* RFQ Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🚀</span>
                        <div>
                          <h3 className="font-semibold text-lg">Multi-Line RFQ</h3>
                          <p className="text-sm text-gray-400">
                            {rfq.total_items} item{rfq.total_items !== 1 ? 's' : ''} • {rfq.total_pieces} piece{rfq.total_pieces !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(rfq.status)}`}>
                        {getStatusText(rfq.status)}
                      </span>
                    </div>

                    {/* RFQ Details */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Company:</span>
                          <p className="text-white">{rfq.company}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Items:</span>
                          <p className="text-white">{rfq.total_items}</p>
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
                      <button 
                        onClick={() => openRfqDetails(rfq)}
                        className="order-1 sm:order-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
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
        </div>
      </main>

      {/* RFQ Details Modal */}
      {showDetailsModal && selectedRfq && (
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
                  {selectedRfq.total_items} items • {selectedRfq.total_pieces} total pieces • {getStatusText(selectedRfq.status)}
                </p>
              </div>
              <button
                onClick={closeRfqDetails}
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
                    <div><span className="text-gray-400">Name:</span> <span className="text-white ml-2">{selectedRfq.full_name}</span></div>
                    <div><span className="text-gray-400">Company:</span> <span className="text-white ml-2">{selectedRfq.company}</span></div>
                    <div><span className="text-gray-400">Email:</span> <span className="text-white ml-2">{selectedRfq.email}</span></div>
                    <div><span className="text-gray-400">Phone:</span> <span className="text-white ml-2">{selectedRfq.phone || 'Not provided'}</span></div>
                  </div>
                </div>

                {/* RFQ Details */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">RFQ Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedRfq.status)}`}>
                        {getStatusText(selectedRfq.status)}
                      </span>
                    </div>
                    <div><span className="text-gray-400">Total Items:</span> <span className="text-white ml-2">{selectedRfq.total_items}</span></div>
                    <div><span className="text-gray-400">Total Pieces:</span> <span className="text-white ml-2">{selectedRfq.total_pieces}</span></div>
                    <div><span className="text-gray-400">Submitted:</span> <span className="text-white ml-2">{formatDate(selectedRfq.created_at)}</span></div>
                    <div><span className="text-gray-400">Last Updated:</span> <span className="text-white ml-2">{formatDate(selectedRfq.updated_at)}</span></div>
                  </div>
                </div>
              </div>

              {/* Compliance & Notes */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Compliance & Requirements</h3>
                <div className="flex items-center gap-4 mb-3">
                  {selectedRfq.dfars_required && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span className="text-blue-400 text-sm">DFARS Required</span>
                    </div>
                  )}
                  {selectedRfq.rohs_compliant && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="text-green-400 text-sm">RoHS Compliant</span>
                    </div>
                  )}
                </div>
                {selectedRfq.additional_notes && (
                  <div>
                    <span className="text-gray-400 text-sm">Additional Notes:</span>
                    <p className="text-white mt-1 p-3 bg-gray-800/50 rounded text-sm whitespace-pre-wrap">{selectedRfq.additional_notes}</p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">RFQ Items ({selectedRfq.total_items})</h3>
                
                {loadingDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading item details...</p>
                  </div>
                ) : selectedRfqWithItems?.items && selectedRfqWithItems.items.length > 0 ? (
                  <div className="space-y-4">
                    {selectedRfqWithItems.items.map((item: any, index: number) => (
                      <div key={item.id} className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-medium">
                                Item #{index + 1}
                              </span>
                              <h4 className="font-semibold text-lg">
                                {getMaterialName(item.material)}
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
                            {selectedRfqWithItems.items.length} unique item{selectedRfqWithItems.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-200">
                            {selectedRfqWithItems.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
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
                    <p className="text-sm mt-1">({selectedRfq.total_pieces} total pieces expected)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex justify-center">
              <button
                onClick={closeRfqDetails}
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
