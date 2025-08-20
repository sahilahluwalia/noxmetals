'use client';

import Link from 'next/link';
import Header from '../components/Header';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Industrial Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,_rgba(59,130,246,0.1)_0%,_transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_75%_75%,_rgba(59,130,246,0.05)_0%,_transparent_50%)]"></div>
        </div>
        {/* Metal texture overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-transparent via-gray-700/5 to-transparent bg-[size:40px_40px] bg-[image:repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]"></div>
        </div>
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 shadow-2xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-gray-400 text-lg">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Terms Content */}
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Acceptance of Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing and using NOX METALS services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. Description of Service</h2>
              <p className="text-gray-300 leading-relaxed">
                NOX METALS provides metal cutting, processing, and supply services to manufacturers and industrial clients. We offer fast quotes, competitive pricing, and full traceability for all materials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">3. User Responsibilities</h2>
              <div className="space-y-3">
                <p className="text-gray-300 leading-relaxed">You agree to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Provide accurate and complete information for quotes and orders</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Use our services only for lawful purposes</li>
                  <li>Maintain the security of your account credentials</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">4. Order and Payment Terms</h2>
              <div className="space-y-3">
                <p className="text-gray-300 leading-relaxed">All orders are subject to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Material availability and current market conditions</li>
                  <li>Payment terms as specified in your quote</li>
                  <li>Quality standards and specifications</li>
                  <li>Delivery timelines based on order complexity</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">5. Quality and Warranty</h2>
              <p className="text-gray-300 leading-relaxed">
                NOX METALS guarantees that all materials meet industry standards and specifications. We provide material certifications and traceability documentation. Claims must be reported within 30 days of delivery.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">6. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">
                Our liability is limited to the value of the materials provided. We are not responsible for indirect, incidental, or consequential damages arising from the use of our materials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">7. Privacy and Data Protection</h2>
              <p className="text-gray-300 leading-relaxed">
                We protect your data according to our Privacy Policy. By using our services, you consent to our collection and use of information as described therein.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">8. Termination</h2>
              <p className="text-gray-300 leading-relaxed">
                Either party may terminate this agreement with written notice. Outstanding orders must be completed, and payment obligations remain in effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">9. Governing Law</h2>
              <p className="text-gray-300 leading-relaxed">
                These terms are governed by the laws of the United States and the state where NOX METALS operates. Any disputes will be resolved through binding arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">10. Contact Information</h2>
              <p className="text-gray-300 leading-relaxed">
                For questions about these terms, please contact us at{' '}
                <a href="mailto:legal@noxmetals.com" className="text-blue-400 hover:text-blue-300 underline">
                  legal@noxmetals.com
                </a>
              </p>
            </section>
          </div>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                © {new Date().getFullYear()} NOX METALS. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
