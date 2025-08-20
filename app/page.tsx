'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import { createClient } from './utils/supabase/client';

export default function Home() {
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
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
    dfarsRequired: false
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

    try {
      if (user) {
        // User is logged in - save to their account
        const supabase = createClient();
        
        const { error } = await supabase
          .from('quotes')
          .insert({
            user_id: user.id,
            full_name: formData.fullName,
            company: formData.company,
            email: formData.email,
            phone: formData.phone,
            length: parseFloat(formData.length) || 0,
            width: parseFloat(formData.width) || 0,
            height: parseFloat(formData.height) || 0,
            material: formData.material,
            quantity: parseInt(formData.qty) || 1,
            material_spec: formData.materialSpec,
            dfars_required: formData.dfarsRequired,
            additional_notes: '',
            status: 'pending'
          });

        if (error) throw error;

        setMessage({ type: 'success', text: 'Quote submitted successfully! Check your dashboard to track progress. 🎉' });
        
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
            dfarsRequired: false
          });
          setMessage(null);
        }, 5000);

      } else {
        // User is not logged in - show message to create account
        setMessage({ type: 'error', text: 'Please create an account or log in to submit quotes. This helps us track your requests and provide better service.' });
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      setMessage({ type: 'error', text: 'Failed to submit quote. Please try again or contact support.' });
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
        <div className="absolute inset-0 bg-gray-800">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/60"></div>
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
                    onClick={() => window.location.href = '/signup'}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors"
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
                <span className="text-sm text-gray-400">Multi-line RFQ</span>
              </div>
              
              {user ? (
                <p className="text-sm text-green-400 mb-4">
                  ✓ Logged in as {user.user_metadata?.full_name || user.email}
                </p>
              ) : (
                <p className="text-sm text-yellow-400 mb-4">
                  ⚠️ Create an account to save and track your quotes
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    />
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    />
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    />
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    />
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    />
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    />
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select material</option>
                      <option value="6061-t6">6061-T6 Aluminum</option>
                      <option value="7075-t6">7075-T6 Aluminum</option>
                      <option value="5000-series">5000 Series Aluminum</option>
                      <option value="7050-t7451">7050-T7451 Aluminum</option>
                      <option value="p20-tool-steel">P20 Tool Steel</option>
                    </select>
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    />
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  />
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
                  <button
                    type="button"
                    className="border border-gray-600 hover:border-gray-500 px-6 py-3 rounded font-medium transition-colors"
                  >
                    Email us
                  </button>
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
          <h3 className="text-center text-gray-400 text-sm mb-8">
            Trusted by modern manufacturers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">Logo {i + 1}</span>
              </div>
            ))}
          </div>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
              <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                <h3 className="text-lg font-semibold mb-2">{material.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{material.subtitle}</p>
                <p className="text-sm text-gray-300 mb-4">{material.description}</p>
                
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">AVAILABLE FORMS</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="bg-gray-700 px-2 py-1 rounded text-center">Plate</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-center">Bar</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-center">Round</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-center">Block</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">{material.sizes}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg border border-gray-600 transition-colors">
              🔜 More materials coming soon
            </button>
          </div>
        </div>
      </section>

      {/* Why Nox Metals */}
      <section className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Nox Metals</h2>
            <p className="text-xl text-gray-300">
              Speed, cost, and software-first visibility for machinists.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Speed</h3>
              <p className="text-gray-300">
                Quote fast. Cut, pack, and ship quickly with software-paced ops.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Cost</h3>
              <p className="text-gray-300">
                Optimized nesting + routing to lower landed costs without surprises.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Software</h3>
              <p className="text-gray-300">
                End-to-end visibility—orders, certs, paperwork—in one portal with AI assist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Advantages */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Same‑day quotes</h3>
              <p className="text-sm text-gray-400">Instant pricing + lead times.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lower landed cost</h3>
              <p className="text-sm text-gray-400">Optimized nesting + sourcing.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">DFARS compliant</h3>
              <p className="text-sm text-gray-400">Traceability and certs on file.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🚚</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Nationwide shipping</h3>
              <p className="text-sm text-gray-400">Fast dispatch, insured freight.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">Ready to move faster?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Send dimensions today. We&apos;ll reply with price + lead time and set you up in the portal.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors">
              Start a quote
            </button>
            <a href="/contact" className="border border-blue-200 hover:border-white hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors inline-block text-center">
              Email us
            </a>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-8">Our mission</h2>
            <p className="text-xl leading-relaxed text-gray-300">
              Nox Metals exists to reindustrialize America by rebuilding the nation&apos;s 
              industrial supply chain from the ground up. We are creating the modern metals 
              supplier that is fast, software driven, and built to arm the factories that 
              power our economy. By delivering certified domestic metal at unprecedented 
              speed and scale, we strengthen the industrial base and give American 
              manufacturing the tools to win.
            </p>
          </div>

          {/* Photo Gallery */}
          <div className="mt-16">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <span className="text-xs text-gray-500">Photo {i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
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
                <span className="w-6 h-6 bg-gray-700 rounded"></span>
                <span className="w-6 h-6 bg-gray-700 rounded"></span>
                <span className="w-6 h-6 bg-gray-700 rounded"></span>
              </div>
            </div>

            <div className="flex space-x-6 text-sm">
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">
              Send direct quotes to{' '}
              <a href="mailto:zane@noxmetals.co" className="text-blue-400 hover:text-blue-300 transition-colors">
                zane@noxmetals.co
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
