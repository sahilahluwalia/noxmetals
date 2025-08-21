'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { 
  MultilineRFQSchema, 
  formatMultilineRFQZodErrors, 
  getFieldErrorMessage,
  calculateTotals,
  materialOptions,
  type MultilineRFQData, 
  type RFQItemData,
  type MultilineRFQFormErrors 
} from '../../utils/schemas/multilineRfqSchemas';
import Link from 'next/link';

interface ItemFormErrors {
  [key: string]: {
    material?: string[];
    materialSpec?: string[];
    length?: string[];
    width?: string[];
    height?: string[];
    quantity?: string[];
    description?: string[];
  };
}

export default function MultilineRFQPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<MultilineRFQFormErrors | null>(null);
  const [itemErrors, setItemErrors] = useState<ItemFormErrors>({});

  // Form data
  const [formData, setFormData] = useState<MultilineRFQData>({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    additionalNotes: '',
    dfarsRequired: false,
    rohsCompliant: false,
    items: []
  });

  // Current item being added
  const [currentItem, setCurrentItem] = useState<RFQItemData>({
    material: '',
    materialSpec: '',
    length: '',
    width: '',
    height: '',
    quantity: '1',
    description: ''
  });

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
    
    // Pre-fill form with user data if available
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || '',
        company: user.user_metadata?.company || '',
        email: user.email || ''
      }));
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Clear validation errors for this field when user starts typing
    if (validationErrors?.fieldErrors?.[name as keyof MultilineRFQData]) {
      setValidationErrors(prev => {
        if (!prev) return null;
        const newFieldErrors = { ...prev.fieldErrors };
        delete newFieldErrors[name as keyof MultilineRFQData];
        return {
          ...prev,
          fieldErrors: newFieldErrors
        };
      });
    }
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    // Validate current item
    try {
      const validatedItem = {
        material: currentItem.material,
        materialSpec: currentItem.materialSpec,
        length: currentItem.length,
        width: currentItem.width,
        height: currentItem.height,
        quantity: currentItem.quantity,
        description: currentItem.description
      };

      if (editingItemIndex !== null) {
        // Update existing item
        const updatedItems = [...formData.items];
        updatedItems[editingItemIndex] = validatedItem;
        setFormData(prev => ({ ...prev, items: updatedItems }));
        setEditingItemIndex(null);
      } else {
        // Add new item
        setFormData(prev => ({ 
          ...prev, 
          items: [...prev.items, validatedItem] 
        }));
      }

      // Reset form
      setCurrentItem({
        material: '',
        materialSpec: '',
        length: '',
        width: '',
        height: '',
        quantity: '1',
        description: ''
      });
      setShowItemForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleEditItem = (index: number) => {
    const item = formData.items[index];
    setCurrentItem(item);
    setEditingItemIndex(index);
    setShowItemForm(true);
  };

  const handleUpdateQuantity = (index: number, newQuantity: string) => {
    const updatedItems = [...formData.items];
    updatedItems[index].quantity = newQuantity;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMessage(null);
    setValidationErrors(null);

    try {
      // Validate form data with Zod
      const validationResult = MultilineRFQSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const formattedErrors = formatMultilineRFQZodErrors(validationResult.error);
        setValidationErrors(formattedErrors);
        setMessage({ type: 'error', text: 'Please fix the validation errors below.' });
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/multiline-rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationResult.data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
          setMessage({ type: 'error', text: 'Please fix the validation errors below.' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to submit RFQ. Please try again.' });
        }
        setSubmitting(false);
        return;
      }

      setMessage({ 
        type: 'success', 
        text: `Multi-line RFQ submitted successfully! 🎉 (${result.total_items} items, ${result.total_pieces} pieces)` 
      });
      setValidationErrors(null);
      
      // Reset form after successful submission
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error submitting multiline RFQ:', error);
      setMessage({ type: 'error', text: 'Failed to submit RFQ. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const { totalItems, totalPieces } = calculateTotals(formData.items);

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
            <Link 
              href="/dashboard"
              className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Multi-Line RFQ </h1>
                <p className="text-gray-400 text-lg">
                  Build your quote with multiple items. Add materials, dimensions, and quantities to create a comprehensive RFQ.
                </p>
              </div>
              {totalItems > 0 && (
                <div className="mt-4 md:mt-0 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{totalItems}</div>
                  <div className="text-sm text-blue-200">RFQ Items</div>
                  <div className="text-lg font-semibold text-white mt-1">{totalPieces} total pieces</div>
                </div>
              )}
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-900/30 border border-green-700/50 text-green-200' 
                : 'bg-red-900/30 border border-red-700/50 text-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Form-level Validation Errors */}
          {validationErrors?.formErrors && validationErrors.formErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
              <h4 className="text-red-200 font-medium mb-2">Form Validation Errors:</h4>
              <ul className="list-disc list-inside text-red-200 text-sm space-y-1">
                {validationErrors.formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Items Section */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">RFQ Items ({totalItems})</h2>
                  {totalItems > 0 && (
                    <p className="text-gray-400">
                      {totalPieces} total pieces • Review your items before submitting.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowItemForm(true);
                    setEditingItemIndex(null);
                    setCurrentItem({
                      material: '',
                      materialSpec: '',
                      length: '',
                      width: '',
                      height: '',
                      quantity: '1',
                      description: ''
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Item to RFQ
                </button>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="space-y-4 mb-6">
                  {formData.items.map((item, index) => (
                    <div key={index} className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">
                              {materialOptions.find(m => m.value === item.material)?.label || item.material}
                            </h4>
                            {item.description && (
                              <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                {item.description.slice(0, 50)}
                                {item.description.length > 50 ? '...' : ''}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-300">
                            <div>L: {item.length}"</div>
                            <div>W: {item.width}"</div>
                            <div>H: {item.height}"</div>
                            <div>Qty: {item.quantity}</div>
                          </div>
                          {item.materialSpec && (
                            <div className="text-sm text-gray-400 mt-1">
                              Spec: {item.materialSpec}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 md:mt-0">
                          {/* Quick edit quantity */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">Quick edit quantity:</span>
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(index, e.target.value)}
                              className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleEditItem(index)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {formData.items.length === 0 && (
                <div className="text-center py-12 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Items Added</h3>
                  <p className="text-gray-400 mb-4">Start building your RFQ by adding your first item</p>
                  <button
                    type="button"
                    onClick={() => setShowItemForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add Your First Item
                  </button>
                </div>
              )}
            </div>

            {/* Add Item Form Modal */}
            {showItemForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">
                      {editingItemIndex !== null ? 'Edit Item' : 'Add Item to RFQ'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowItemForm(false);
                        setEditingItemIndex(null);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Material *</label>
                        <select
                          name="material"
                          value={currentItem.material}
                          onChange={handleItemInputChange}
                          required
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select material</option>
                          {materialOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Material Specification</label>
                        <input
                          type="text"
                          name="materialSpec"
                          value={currentItem.materialSpec}
                          onChange={handleItemInputChange}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="e.g., T6511, Annealed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Length (in) *</label>
                        <input
                          type="number"
                          name="length"
                          value={currentItem.length}
                          onChange={handleItemInputChange}
                          required
                          step="0.001"
                          min="0"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="0.000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Width (in) *</label>
                        <input
                          type="number"
                          name="width"
                          value={currentItem.width}
                          onChange={handleItemInputChange}
                          required
                          step="0.001"
                          min="0"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="0.000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Height (in) *</label>
                        <input
                          type="number"
                          name="height"
                          value={currentItem.height}
                          onChange={handleItemInputChange}
                          required
                          step="0.001"
                          min="0"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="0.000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={currentItem.quantity}
                        onChange={handleItemInputChange}
                        required
                        min="1"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        name="description"
                        value={currentItem.description}
                        onChange={handleItemInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Additional specifications or requirements"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        {editingItemIndex !== null ? 'Update Item' : 'Add Item to Cart'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowItemForm(false);
                          setEditingItemIndex(null);
                        }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RFQ Settings */}
            {formData.items.length > 0 && (
              <>
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4">RFQ Settings</h2>
                  <p className="text-gray-400 mb-6">Using your saved profile information</p>

                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Submitting as:</h3>
                    <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                      <div className="font-medium">{formData.fullName}</div>
                      <div className="text-gray-300">{formData.email}</div>
                      <div className="text-gray-300">{formData.company}</div>
                      <div className="text-gray-300">{formData.phone}</div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                          getFieldErrorMessage(validationErrors?.fieldErrors?.fullName)
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-gray-600 focus:border-blue-500'
                        }`}
                      />
                      {getFieldErrorMessage(validationErrors?.fieldErrors?.fullName) && (
                        <p className="mt-1 text-sm text-red-400">
                          {getFieldErrorMessage(validationErrors?.fieldErrors?.fullName)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Company *</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                          getFieldErrorMessage(validationErrors?.fieldErrors?.company)
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-gray-600 focus:border-blue-500'
                        }`}
                      />
                      {getFieldErrorMessage(validationErrors?.fieldErrors?.company) && (
                        <p className="mt-1 text-sm text-red-400">
                          {getFieldErrorMessage(validationErrors?.fieldErrors?.company)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                          getFieldErrorMessage(validationErrors?.fieldErrors?.email)
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-gray-600 focus:border-blue-500'
                        }`}
                      />
                      {getFieldErrorMessage(validationErrors?.fieldErrors?.email) && (
                        <p className="mt-1 text-sm text-red-400">
                          {getFieldErrorMessage(validationErrors?.fieldErrors?.email)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                          getFieldErrorMessage(validationErrors?.fieldErrors?.phone)
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-gray-600 focus:border-blue-500'
                        }`}
                      />
                      {getFieldErrorMessage(validationErrors?.fieldErrors?.phone) && (
                        <p className="mt-1 text-sm text-red-400">
                          {getFieldErrorMessage(validationErrors?.fieldErrors?.phone)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Additional Notes</label>
                    <textarea
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Timeline, special requirements, certifications needed..."
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.additionalNotes) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.additionalNotes)}
                      </p>
                    )}
                  </div>

                  {/* Compliance Requirements */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Compliance Requirements</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="dfarsRequired"
                          checked={formData.dfarsRequired}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm">DFARS required</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="rohsCompliant"
                          checked={formData.rohsCompliant}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm">RoHS Compliant Material Required</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Section */}
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Submit RFQ</h2>
                      <p className="text-gray-400 mb-4">
                        Ready to get your secure quote? We'll respond within 24 hours.
                      </p>
                      
                      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Secure Quote Summary</h3>
                        <p className="text-sm text-blue-200">
                          {totalItems} unique items • {totalPieces} total pieces
                        </p>
                        <div className="flex items-center gap-4 text-xs text-blue-300 mt-2">
                          <div className="flex items-center gap-1">
                            <span>🔒</span>
                            <span>Secure submission</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>✦</span>
                            <span>Fast quoting</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>✦</span>
                            <span>Full doc tracking</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                      <button
                        type="submit"
                        disabled={submitting || formData.items.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Submit Secure RFQ'}
                      </button>
                      <div className="text-center text-xs text-gray-400">
                        <p>🔒 Your business information is protected.</p>
                        <p>DFARS + domestic mill paperwork provided in the portal.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
