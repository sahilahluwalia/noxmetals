'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isAuthPage = pathname === '/auth' || pathname === '/signup';

  // Simple header for auth pages
  if (isAuthPage) {
    return (
      <header className="relative z-50 bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold tracking-wider">
              NOX METALS
            </Link>
            <Link 
              href="/" 
              className="flex items-center text-gray-300 hover:text-white transition-colors group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Full header for all other pages
  return (
    <header className="relative z-50 bg-gray-900/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold tracking-wider">
            NOX METALS
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/#materials" className="text-gray-300 hover:text-white transition-colors">
              Materials
            </Link>
            <Link href="/#mission" className="text-gray-300 hover:text-white transition-colors">
              Mission
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <input
              type="email"
              placeholder="your@email.com"
              className="hidden sm:block px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
            />
            <Link 
              href="/signup" 
              className="hidden sm:inline-block text-gray-300 hover:text-white transition-colors"
            >
              Join
            </Link>
            <Link 
              href="/auth" 
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/#quote" 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition-colors"
            >
              Get Quote
            </Link>
            
            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-800 border-t border-gray-700">
            <div className="px-4 py-2 space-y-1">
              <Link 
                href="/#materials" 
                className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Materials
              </Link>
              <Link 
                href="/#mission" 
                className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mission
              </Link>
              <Link 
                href="/contact" 
                className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="border-t border-gray-700 pt-2 mt-2">
                <Link 
                  href="/signup" 
                  className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Join
                </Link>
                <Link 
                  href="/auth" 
                  className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/#quote" 
                  className="block px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded mt-2 text-center font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Quote
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
