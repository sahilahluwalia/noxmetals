'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, signOut, isAdmin, userRole } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAuthPage = pathname === '/auth' || pathname === '/signup';
  const isAdminPage = pathname.startsWith('/admin');

  const handleSignOut = async () => {
    await signOut();
    setAccountDropdownOpen(false);
    // Navigation is now handled by the AuthContext
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            {!isAdminPage && (
              <>
                <Link href="/#materials" className="text-gray-300 hover:text-white transition-colors">
                  Materials
                </Link>
                <Link href="/#mission" className="text-gray-300 hover:text-white transition-colors">
                  Mission
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </>
            )}
           
          </nav>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block h-9 w-28 rounded-md bg-gray-800/70 animate-pulse" />
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-800/70 animate-pulse" />
                  <div className="hidden sm:block">
                    <div className="h-3 w-24 bg-gray-800/70 rounded animate-pulse mb-1" />
                    <div className="h-2 w-16 bg-gray-800/70 rounded animate-pulse" />
                  </div>
                </div>
                {!isAdminPage && (
                  <div className="h-9 w-24 rounded-md bg-blue-900/40 animate-pulse" />
                )}
              </div>
            ) : (
              <>
                {user ? (
                  // User is authenticated
                  <div className="flex items-center space-x-4">
                    {/* Dashboard Button */}
                    {isAdminPage ? (
              <>
                <Link href="/admin/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Admin Dashboard
                </Link>
              
              </>
            ) : (
                    <Link
                      href="/dashboard"
                      className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                    )}
                    {/* Account Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                        className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-gray-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div className="text-left">
                          <div className="font-medium">{user.user_metadata?.full_name || user.email}</div>
                          {isAdmin && (
                            <div className="text-xs text-purple-400">
                              {userRole?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </div>
                          )}
                        </div>
                        <svg className={`w-4 h-4 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {accountDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-50">
                          <div className="py-1">
                            <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                              <div className="font-medium text-white">{user.user_metadata?.full_name || 'User'}</div>
                              <div className="text-xs">{user.email}</div>
                            </div>

                            <Link
                              href="/profile"
                              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                              onClick={() => setAccountDropdownOpen(false)}
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Profile Settings
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {!isAdminPage && (
                      <Link 
                        href="/#quote" 
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition-colors"
                      >
                        Get Quote
                      </Link>
                    )}
                  </div>
                ) : (
                  // User is not authenticated
                  <>
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
                  </>
                )}
              </>
            )}
            
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
              {!isAdminPage ? (
                <>
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
                </>
              ) : (
                <>
                  <Link 
                    href="/admin/dashboard" 
                    className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    User Dashboard
                  </Link>
                </>
              )}
              <div className="border-t border-gray-700 pt-2 mt-2">
                {loading ? (
                  <>
                    <div className="px-3 py-2 border-b border-gray-700 pb-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-gray-800/70 animate-pulse" />
                        <div className="flex-1">
                          <div className="h-3 w-40 bg-gray-800/70 rounded animate-pulse mb-1" />
                          <div className="h-2 w-24 bg-gray-800/70 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                    {!isAdminPage && (
                      <div className="block px-3 py-2 bg-blue-900/40 rounded mt-2 animate-pulse" />
                    )}
                  </>
                ) : (
                  <>
                    {user ? (
                      // User is authenticated in mobile menu
                      <>
                        <div className="px-3 py-2 text-sm text-gray-400 border-b border-gray-700 pb-2 mb-2">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{user.user_metadata?.full_name || user.email}</span>
                          </div>
                          {isAdmin && (
                            <div className="mt-2">
                              <span className="px-2 py-1 bg-purple-600 rounded-full text-xs font-medium text-white">
                                {userRole?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                              </span>
                            </div>
                          )}
                        </div>

                        <Link
                          href="/profile"
                          className="flex items-center px-3 py-2 text-gray-300 hover:text-white transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Profile Settings
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center w-full text-left px-3 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </>
                    ) : (
                      // User is not authenticated in mobile menu
                      <>
                        <Link 
                          href="/auth" 
                          className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                      </>
                    )}
                  </>
                )}
                {!isAdminPage && (
                  loading ? (
                    <div className="block px-3 py-2 bg-blue-900/40 rounded mt-2 animate-pulse" />
                  ) : (
                    <Link 
                      href="/#quote" 
                      className="block px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded mt-2 text-center font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Quote
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
