'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase/client';
import Header from '../../components/Header';
import { QuoteFormSchema, formatZodErrors, getFieldErrorMessage, type QuoteFormData, type QuoteFormErrors } from '../../utils/schemas/quoteSchemas';
import Link from 'next/link';

// QuoteFormData type is now imported from schemas

export default function SubmitQuotePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<QuoteFormErrors | null>(null);

  const [formData, setFormData] = useState<QuoteFormData>({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    length: '',
    width: '',
    height: '',
    material: '',
    qty: '1',
    materialSpec: '',
    dfarsRequired: false,
    additionalNotes: ''
  });

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
    if (validationErrors?.fieldErrors?.[name as keyof QuoteFormData]) {
      setValidationErrors(prev => {
        if (!prev) return null;
        const newFieldErrors = { ...prev.fieldErrors };
        delete newFieldErrors[name as keyof QuoteFormData];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMessage(null);
    setValidationErrors(null);

    try {
      // Validate form data with Zod
      const validationResult = QuoteFormSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const formattedErrors = formatZodErrors(validationResult.error);
        setValidationErrors(formattedErrors);
        setMessage({ type: 'error', text: 'Please fix the validation errors below.' });
        setSubmitting(false);
        return;
      }

      const validatedData = validationResult.data;
      
      // Using singleton supabase instance
      const { error } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          full_name: validatedData.fullName,
          company: validatedData.company,
          email: validatedData.email,
          phone: validatedData.phone || null,
          length: parseFloat(validatedData.length),
          width: parseFloat(validatedData.width),
          height: parseFloat(validatedData.height),
          material: validatedData.material,
          quantity: parseInt(validatedData.qty),
          material_spec: validatedData.materialSpec || null,
          dfars_required: validatedData.dfarsRequired,
          additional_notes: validatedData.additionalNotes || null,
          status: 'pending'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Database error occurred');
      }

      setMessage({ type: 'success', text: 'Quote submitted successfully! 🎉' });
      setValidationErrors(null);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          fullName: user.user_metadata?.full_name || '',
          company: user.user_metadata?.company || '',
          email: user.email || '',
          phone: '',
          length: '',
          width: '',
          height: '',
          material: '',
          qty: '1',
          materialSpec: '',
          dfarsRequired: false,
          additionalNotes: ''
        });
        setMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Error submitting quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit quote. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
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
            <Link
              href="/dashboard"
              className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-4">Submit New Quote</h1>
            <p className="text-gray-400 text-lg">
              Fill out the form below to request a quote for your metal requirements
            </p>
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

          {/* Quote Form */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="Jane Doe"
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
                      placeholder="Acme Machining"
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
                      placeholder="jane@acme.com"
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.email) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.email)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.phone)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                      placeholder="(555) 123-4567"
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.phone) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.phone)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Dimensions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Length (inches) *</label>
                    <input
                      type="number"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.length)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                      placeholder="60.5"
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.length) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.length)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Width (inches) *</label>
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.width)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                      placeholder="14.5"
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.width) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.width)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Height (inches) *</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.height)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                      placeholder="6"
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.height) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.height)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Material & Quantity */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Material & Quantity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Material *</label>
                    <select
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.material)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    >
                      <option value="">Select material</option>
                      <option value="6061-t6">6061-T6 Aluminum</option>
                      <option value="7075-t6">7075-T6 Aluminum</option>
                      <option value="5000-series">5000 Series Aluminum</option>
                      <option value="7050-t7451">7050-T7451 Aluminum</option>
                      <option value="p20-tool-steel">P20 Tool Steel</option>
                      <option value="other">Other (specify in notes)</option>
                    </select>
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.material) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.material)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity *</label>
                    <input
                      type="number"
                      name="qty"
                      value={formData.qty}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.qty)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                      placeholder="1"
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.qty) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.qty)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Specifications</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Material Specification (AMS/ASTM/ISO)
                    </label>
                    <input
                      type="text"
                      name="materialSpec"
                      value={formData.materialSpec}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.materialSpec)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                      placeholder="e.g., AMS 4027 Rev G, T6"
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.materialSpec) && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.materialSpec)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Include revision/temper and any specific certification requirements
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="dfarsRequired"
                      checked={formData.dfarsRequired}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm">DFARS compliance required</label>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none transition-colors resize-none ${
                    getFieldErrorMessage(validationErrors?.fieldErrors?.additionalNotes)
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-gray-600 focus:border-blue-500'
                  }`}
                  placeholder="Any additional requirements, special instructions, or questions..."
                />
                {getFieldErrorMessage(validationErrors?.fieldErrors?.additionalNotes) && (
                  <p className="mt-1 text-sm text-red-400">
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.additionalNotes)}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Quote Request'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                By submitting this quote request, you agree to our terms of service. 
                We&apos;ll respond within 24 hours with pricing and lead times.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
