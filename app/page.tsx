'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import SlidingCarousel from './components/SlidingCarousel';
import { createClient } from './utils/supabase/client';
import { QuoteFormSchema, formatZodErrors, getFieldErrorMessage, type QuoteFormData, type QuoteFormErrors } from './utils/schemas/quoteSchemas';

const customerLogos = [
  '/clients/1.png',
  '/clients/2.png',
  '/clients/3.png',
  '/clients/4.png',
]

// Example: Additional carousel data
const partnerLogos = [
  '/humans/1.png',
  '/humans/2.png',
  '/humans/3.png',
  '/humans/4.png',
  '/humans/5.png', 
  '/humans/6.png',
  '/humans/7.png',
  '/humans/8.png',
  '/humans/9.png',
  
]

export default function Home() {
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<QuoteFormErrors | null>(null);
  const [showMultilineMessage, setShowMultilineMessage] = useState(false);

  console.log('Supabase Auth is Pain, I am not good at this auth, so currently it is bit buggy, please ignore some minor issues related to auth, i hope you will agree with this, i use to think nextauth is pain, but bro this is more, have to study it properly');
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
    additionalNotes: '' // Added to match schema
  });

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user && !loading) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || '',
        company: user.user_metadata?.company || '',
        email: user.email || ''
      }));
    }
  }, [user, loading]);

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

      if (user) {
        // User is logged in - save to their account
        const supabase = createClient();
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

        setMessage({ type: 'success', text: 'Quote submitted successfully! Check your dashboard to track progress. 🎉' });
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

      } else {
        // User is not logged in - submit quote anonymously and encourage login
        // First, submit the quote to the system without a user_id
        const supabase = createClient();
        const { error } = await supabase
          .from('quotes')
          .insert({
            user_id: null, // No user_id for anonymous quotes
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

        // Show success message
        setMessage({ 
          type: 'success', 
          text: '✅ Quote submitted successfully! 🔐 Login to view your request and track progress.' 
        });

        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
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
          setMessage(null);
        }, 6000);
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit quote. Please try again or contact support.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Navigation */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900/60">
          {/* Industrial gradient overlay with metallic tones */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 via-zinc-500/15 to-gray-600/20 animate-gradient-shift"></div>
          
          {/* Industrial Manufacturing Elements */}
          <div className="absolute inset-0">
            {/* Metal Sheet Representations */}
            <div className="absolute top-20 left-10 w-48 h-32 sm:w-64 sm:h-40 lg:w-96 lg:h-48 bg-gradient-to-r from-slate-400/20 to-blue-400/15 transform rotate-12 animate-pulse border border-slate-500/10"></div>
            <div className="absolute top-40 right-20 w-40 h-60 sm:w-56 sm:h-80 lg:w-72 lg:h-96 bg-gradient-to-b from-zinc-400/15 to-slate-400/20 transform -rotate-6 animate-pulse delay-1000 border border-zinc-500/10"></div>
            <div className="absolute bottom-20 left-1/3 w-56 h-28 sm:w-72 sm:h-36 lg:w-88 lg:h-44 bg-gradient-to-r from-gray-400/25 to-slate-300/15 transform rotate-3 animate-pulse delay-2000 border border-gray-500/15"></div>
            
            {/* Industrial Hexagon Pattern */}
            <div className="absolute top-32 right-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-400/40 transform rotate-45 animate-bounce delay-500" style={{clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'}}></div>
            <div className="absolute top-64 left-1/4 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400/50 transform rotate-12 animate-bounce delay-700" style={{clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'}}></div>
            <div className="absolute bottom-1/3 right-1/3 w-10 h-10 sm:w-14 sm:h-14 bg-amber-400/35 transform -rotate-12 animate-bounce delay-1200" style={{clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'}}></div>
            
            {/* Metal Bars and Industrial Elements */}
            <div className="absolute top-1/2 left-16 w-20 h-4 sm:w-28 sm:h-6 bg-gradient-to-r from-steel-400/30 to-slate-400/40 animate-spin-slow shadow-xl shadow-slate-500/20" style={{backgroundColor: '#71717a'}}></div>
            <div className="absolute top-3/4 right-12 w-4 h-28 sm:w-6 sm:h-36 bg-gradient-to-b from-zinc-400/40 to-gray-400/25 transform -rotate-12 animate-float delay-1500"></div>
            <div className="absolute top-16 left-3/4 w-3 h-20 bg-gradient-to-t from-orange-500/35 to-transparent animate-float delay-2500"></div>
            <div className="absolute bottom-32 right-16 w-16 h-3 bg-gradient-to-r from-amber-500/30 to-transparent animate-float delay-3000"></div>
            
            {/* Circuit Board / Technical Drawing Lines */}
            <div className="absolute top-24 left-1/2 w-32 h-px bg-blue-400/40 animate-pulse delay-800"></div>
            <div className="absolute top-56 right-1/3 w-px h-24 bg-orange-400/40 animate-pulse delay-1300"></div>
            <div className="absolute bottom-40 left-1/4 w-20 h-px bg-yellow-400/40 animate-pulse delay-1800"></div>
            
            {/* Technical Blueprint Grid */}
            <div className="absolute inset-0 opacity-12" style={{
              backgroundImage: `
                linear-gradient(rgba(14, 165, 233, 0.25) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14, 165, 233, 0.25) 1px, transparent 1px),
                linear-gradient(rgba(249, 115, 22, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(249, 115, 22, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px, 20px 20px, 80px 80px, 80px 80px'
            }}></div>
            
            {/* Industrial Honeycomb Pattern */}
            <div className="absolute inset-0 opacity-8" style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.15) 2px, transparent 2px)`,
              backgroundSize: '30px 26px'
            }}></div>
            
            {/* Manufacturing Equipment Silhouettes */}
            <div className="absolute top-12 right-12 w-6 h-6 sm:w-10 sm:h-10 bg-orange-400/25 animate-spin-slow" style={{
              clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)'
            }}></div>
            
            {/* Gear Elements */}
            <div className="absolute bottom-16 left-20 w-8 h-8 sm:w-12 sm:h-12 bg-amber-400/30 animate-gear" style={{
              clipPath: 'polygon(50% 0%, 63% 38%, 100% 38%, 69% 59%, 82% 100%, 50% 75%, 18% 100%, 31% 59%, 0% 38%, 37% 38%)'
            }}></div>
            
            {/* Industrial Pipe Elements */}
            <div className="absolute top-48 left-8 w-2 h-24 sm:w-3 sm:h-32 bg-zinc-400/35 rounded-full animate-float delay-2200" style={{
              boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.3), inset -2px 0 4px rgba(255,255,255,0.1)'
            }}></div>
            <div className="absolute bottom-48 right-8 w-20 h-2 sm:w-28 sm:h-3 bg-slate-400/40 rounded-full animate-float delay-2800" style={{
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(255,255,255,0.1)'
            }}></div>
            
            {/* Metal Cutting Path Lines */}
            <div className="absolute top-36 right-1/2 w-24 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent animate-pulse delay-400"></div>
            <div className="absolute top-72 left-1/3 w-px h-16 bg-gradient-to-b from-transparent via-red-400/50 to-transparent animate-pulse delay-1600"></div>
            
            {/* Steel Plate Texture Overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(148, 163, 184, 0.1),
                  rgba(148, 163, 184, 0.1) 2px,
                  transparent 2px,
                  transparent 10px
                ),
                repeating-linear-gradient(
                  -45deg,
                  rgba(148, 163, 184, 0.05),
                  rgba(148, 163, 184, 0.05) 2px,
                  transparent 2px,
                  transparent 10px
                )
              `
            }}></div>
            
            {/* Industrial Corner Brackets */}
            <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-orange-400/30"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-blue-400/30"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-amber-400/30"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-sky-400/30"></div>
          </div>
          
          {/* Reduced overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/60 to-gray-900/75"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Hero Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  The Modern<br />Metals Supplier
                </h1>
                <p className="text-xl text-gray-300 mt-6 leading-relaxed">
                  Nox Metals is building modern factories to supply America&apos;s 
                  industrial base. We cut, process, and supply metals to those 
                  who make parts.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <button 
                    onClick={() => window.location.href = '/dashboard/submit-quote'}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Submit Quote
                  </button>
                ) : (
                  <button 
                    onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Start a quote
                  </button>
                )}
                {!user && (
                  <button 
                    onClick={() => window.location.href = '/signup'}
                    className="border border-gray-600 hover:border-gray-500 px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Create account
                  </button>
                )}
                {user && (
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="border border-gray-600 hover:border-gray-500 px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Go to Dashboard
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">✦</span>
                  <span>Fast quoting</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">✦</span>
                  <span>Lower landed costs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">✦</span>
                  <span>Full doc tracking</span>
                </div>
              </div>
            </div>

            {/* Quote Form - Simplified */}
            <div id="quote" className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quick quote</h3>
                {user ? (
                  <button
                    onClick={() => window.location.href = '/dashboard/multiline-rfq'}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    📋 Multi-line RFQ
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMultilineMessage(true);
                      setTimeout(() => window.location.href = '/auth', 5000);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                    title="Login to access Multi-line RFQ"
                  >
                    📋 Multi-line RFQ
                  </button>
                )}
              </div>
              
              {user ? (
                <p className="text-sm text-green-400 mb-4">
                  ✓ Logged in as {user.user_metadata?.full_name || user.email}
                </p>
              ) : (
                <p className="text-sm text-yellow-400 mb-4">
                  {/* ⚠️ Create an account to save and track your quotes */}
                </p>
              )}
              
              <p className="text-sm text-gray-400 mb-6">
                Lightweight RFQ: dimensions + material. We move fast.
              </p>

              {/* Message Display */}
              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-900/30 border border-green-700/50 text-green-200' 
                    : 'bg-red-900/30 border border-red-700/50 text-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Form-level Validation Errors */}
              {validationErrors?.formErrors && validationErrors.formErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                  <h5 className="text-red-200 font-medium mb-1 text-sm">Validation Errors:</h5>
                  <ul className="list-disc list-inside text-red-200 text-xs space-y-0.5">
                    {validationErrors.formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Multi-line RFQ Access Message */}
              {showMultilineMessage && (
                <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl p-6 shadow-xl mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-orange-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-orange-300 mb-3">Multi-line RFQ Access</h3>
                      <div className="text-sm text-orange-200">
                        <p className="mb-3">🔒 This feature requires authentication to access.</p>
                        <div className="mt-4 text-xs text-orange-300">
                          <p>⏱️ Redirecting to login page in 3 seconds...</p>
                          {/* <p>💡 <strong>P.S:</strong> Like this feature? <em>Hire me :)</em> 🚀</p> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      required
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.fullName)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.fullName) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.fullName)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Acme Machining"
                      required
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.company)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.company) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.company)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="jane@acme.com"
                      required
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.email)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.email) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.email)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.phone)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.phone) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.phone)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Length (in)</label>
                    <input
                      type="number"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      placeholder="60.5"
                      required
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.length)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.length) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.length)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Width (in)</label>
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      placeholder="14.5"
                      required
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.width)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.width) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.width)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Height (in)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="6"
                      required
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.height)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.height) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.height)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Material</label>
                    <select
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
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
                    </select>
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.material) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.material)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Qty</label>
                    <input
                      type="number"
                      name="qty"
                      value={formData.qty}
                      onChange={handleInputChange}
                      min="1"
                      required
                      className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                        getFieldErrorMessage(validationErrors?.fieldErrors?.qty)
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {getFieldErrorMessage(validationErrors?.fieldErrors?.qty) && (
                      <p className="mt-1 text-xs text-red-400">
                        {getFieldErrorMessage(validationErrors?.fieldErrors?.qty)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Material specification (AMS/ASTM/ISO)
                  </label>
                  <input
                    type="text"
                    name="materialSpec"
                    value={formData.materialSpec}
                    onChange={handleInputChange}
                    placeholder="e.g., AMS 4027 Rev G, T6"
                    className={`w-full px-3 py-2 bg-gray-700 border rounded focus:outline-none transition-colors ${
                      getFieldErrorMessage(validationErrors?.fieldErrors?.materialSpec)
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-gray-600 focus:border-blue-500'
                    }`}
                  />
                  {getFieldErrorMessage(validationErrors?.fieldErrors?.materialSpec) && (
                    <p className="mt-1 text-xs text-red-400">
                      {getFieldErrorMessage(validationErrors?.fieldErrors?.materialSpec)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Include revision/temper and any specific certification requirements for traceability and quality control.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="dfarsRequired"
                    checked={formData.dfarsRequired}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm">DFARS required</label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit RFQ'}
                  </button>
                  <a
                    href="mailto:zane@noxmetals.co?subject=Quote Request&body=Hi Zane,%0A%0AI'd like to discuss a quote for:"
                    className="border border-gray-600 hover:border-gray-500 px-6 py-3 rounded font-medium transition-colors inline-block text-center"
                  >
                    Email us
                  </a>
                </div>

                <p className="text-xs text-gray-400">
                  By default: DFARS + domestic mill paperwork provided in the portal. 
                  Custom quote to zane@noxmetals.co
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Logos */}
      <section className="py-16 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlidingCarousel 
            items={customerLogos}
            imageSize={100}
            // title="Trusted by modern manufacturers"
            speed={20}
          />
        </div>
      </section>

      {/* Premium Materials */}
      <section id="materials" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Premium Materials</h2>
            <p className="text-xl text-gray-300">
              Aerospace grade and other solutions for automotive, defense, medical, and industrial applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch">
            {[
              {
                title: "5000 Series Aluminum",
                subtitle: "5000 Series (5052-H32, 5083-H321)",
                description: "Marine grade aluminum with excellent corrosion resistance",
                sizes: "Up to 144.5\" × 60.5\" or smaller"
              },
              {
                title: "6061-T6 Aluminum",
                subtitle: "6061-T6 (QQ-A-200/8, T6511)",
                description: "Excellent corrosion resistance and weldability",
                sizes: "Up to 144.5\" × 60.5\" or smaller"
              },
              {
                title: "7075 Aluminum",
                subtitle: "7075-T6 (QQ-A-250/12, T6511)",
                description: "High strength aerospace grade aluminum",
                sizes: "Up to 144.5\" × 60.5\" or smaller"
              },
              {
                title: "7050-T7451 Aluminum",
                subtitle: "7050-T7451 (QQ-A-250/13)",
                description: "Superior fracture toughness and fatigue resistance",
                sizes: "Up to 144.5\" × 60.5\" or smaller"
              },
              {
                title: "P20 Tool Steel",
                subtitle: "P20 (1.2311, 4140 Modified)",
                description: "Pre-hardened tool steel for precision tooling",
                sizes: "Up to 144.5\" × 60.5\" or smaller"
              }
            ].map((material, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-2">{material.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{material.subtitle}</p>
                <p className="text-sm text-gray-300 mb-4">{material.description}</p>
                
                <p className="text-xs text-gray-500 mb-4">{material.sizes}</p>
                
                <div className="mt-auto">
                  <p className="text-xs text-gray-500 mb-2">AVAILABLE FORMS</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="bg-gray-700 px-2 py-1 rounded text-center">Plate</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-center">Bar</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-center">Round</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-center">Block</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg border border-gray-600 transition-colors">
              More materials coming soon
            </button>
          </div>
        </div>
      </section>

      {/* Why Nox Metals */}
      <section className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 border border-gray-700 px-6 sm:px-10 py-10">
            <div className="md:flex md:items-start md:justify-between mb-10">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Why Nox Metals</h2>
                <p className="mt-2 text-gray-300 max-w-3xl">
                  A dependable metals partner for procurement teams and machine shops. We focus on
                  predictable delivery, traceable paperwork, and attentive customer service.
                </p>
              </div>
              <div className="mt-6 md:mt-0 text-sm text-gray-400">
                <p>Serving aerospace, defense, medical, automotive</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <ul className="space-y-4">
                <li className="flex">
                  <span className="text-blue-400 mr-3">✔</span>
                  <div>
                    <p className="font-medium">Same‑day quoting</p>
                    <p className="text-sm text-gray-400">Firm pricing and clear lead times.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blue-400 mr-3">✔</span>
                  <div>
                    <p className="font-medium">Competitive landed cost</p>
                    <p className="text-sm text-gray-400">Optimized nesting, routing, and sourcing.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blue-400 mr-3">✔</span>
                  <div>
                    <p className="font-medium">DFARS compliant paperwork</p>
                    <p className="text-sm text-gray-400">Full traceability and mill certs on file.</p>
                  </div>
                </li>
              </ul>

              
            </div>

          </div>
        </div>
      </section>

      

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900 overflow-hidden">
        {/* Industrial Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-20 bg-gradient-to-r from-orange-400/10 to-amber-400/15 transform rotate-12 animate-pulse"></div>
          <div className="absolute bottom-16 right-16 w-24 h-36 bg-gradient-to-b from-blue-400/10 to-slate-400/15 transform -rotate-6 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-orange-400/40 transform rotate-45 animate-bounce delay-500" style={{clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'}}></div>
          <div className="absolute bottom-1/3 right-1/3 w-6 h-6 bg-amber-400/35 transform -rotate-12 animate-bounce delay-1200" style={{clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'}}></div>
          
          {/* Technical Grid */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `
              linear-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(14, 165, 233, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-md p-8 sm:p-12 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Ready to move faster?
            </h2>
            <p className="text-lg sm:text-xl mb-8 text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Send dimensions today. We&apos;ll reply with price + lead time and set you up in the portal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 cursor-pointer w-full sm:w-auto"
              >
                <span className="relative z-10">Start a quote</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <a 
                href="mailto:zane@noxmetals.co?subject=Quote Inquiry&body=Hi Zane,%0A%0AI'm interested in getting a quote for:" 
                className="group relative border-2 border-gray-600 hover:border-blue-400 text-gray-300 hover:text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-400/25 inline-block text-center w-full sm:w-auto"
              >
                <span className="relative z-10">Email us</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-slate-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            </div>

            {/* Industrial accent elements */}
            <div className="flex justify-center items-center mt-8 space-x-8 opacity-30">
              <div className="w-8 h-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-slate-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-24 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-white">Our Mission </h2>
            <div className="max-w-4xl mx-auto bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-md p-8 sm:p-12 shadow-2xl">
              <p className="text-xl sm:text-2xl leading-relaxed text-gray-200 font-light">
                Nox Metals exists to <span className="text-white font-semibold">reindustrialize America</span> by rebuilding the nation&apos;s 
                industrial supply chain from the ground up. We are creating the modern metals 
                supplier that is <span className="text-blue-400 font-medium">fast, software driven, and built to scale</span>  
                arming the factories that power our economy with certified domestic metal 
                at unprecedented speed.
              </p>
              
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <p className="text-lg text-slate-300 font-medium">
                  Strengthening America&apos;s industrial base. One delivery at a time.
                </p>
              </div>
            </div>
          </div>

          {/* Sliding Carousel */}
          <div className="mt-16">
            <SlidingCarousel 
              items={partnerLogos}
              title=""
              speed={30}
              imageSize={250}
              spacing="mx-8"
              opacity="opacity-50"
            />
          </div>
        </div>
      </section>

     

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400">© 2025 Nox Metals. All rights reserved.</p>
            </div>
            
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <span className="text-gray-400">Backed by YC</span>
              <div className="flex space-x-4">
              </div>
            </div>

            <div className="flex space-x-6 text-sm">
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-gray-400 text-center sm:text-left">
                Send direct quotes to{' '}
                <a href="mailto:zane@noxmetals.co" className="text-blue-400 hover:text-blue-300 transition-colors">
                  zane@noxmetals.co
                </a>
              </p>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm"></span>
                <a 
                  href="https://github.com/sahilahluwalia/noxmetals" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center space-x-1"
                >
                  <span>View Source Code</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
