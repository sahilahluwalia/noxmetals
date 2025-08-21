'use client';

import { ReactNode } from 'react';
import Header from './Header';

interface DemoCredentialsProps {
  className?: string;
}

// Individual Demo Credential Components
const DemoAdminCard = () => (
  <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6 shadow-xl w-full max-w-sm mx-auto lg:mx-0">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="w-6 h-6 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">
          Demo Admin Access
        </h3>
        <div className="text-sm text-blue-200">
          <p className="mb-3">Experience full administrative features:</p>
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 font-mono text-sm">
            <div className="mb-2"><span className="text-blue-300 font-medium">Email:</span></div>
            <div className="text-blue-100 mb-3 break-all">admin@gmail.com</div>
            <div className="mb-2"><span className="text-blue-300 font-medium">Password:</span></div>
            <div className="text-blue-100">12345678</div>
          </div>
          <div className="mt-4 text-xs text-blue-300 space-y-1">
            <p>✨ Experience full admin capabilities</p>
            <p>📊 Review, approve, or reject quotes</p>
            <p>📝 Manage all RFQ submissions</p>
            <p>🔍 Search and view user accounts</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DemoUserCard = () => (
  <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-6 shadow-xl w-full max-w-sm mx-auto lg:mx-0">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="w-6 h-6 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-lg font-semibold text-green-300 mb-3">
          Demo User Access
        </h3>
        <div className="text-sm text-green-200">
          <p className="mb-3">Try the standard user experience:</p>
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 font-mono text-sm">
            <div className="mb-2"><span className="text-green-300 font-medium">Email:</span></div>
            <div className="text-green-100 mb-3 break-all">iamsahilahluwalia@gmail.com</div>
            <div className="mb-2"><span className="text-green-300 font-medium">Password:</span></div>
            <div className="text-green-100">123456</div>
          </div>
          <div className="mt-4 text-xs text-green-300 space-y-1">
            <p>💼 Submit and track RFQ requests</p>
            <p>📋 View quote history and status</p>
            <p>📧 Receive email notifications</p>
            <p>👔 Manage profile and company info</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DemoCredentials = ({ className = '' }: DemoCredentialsProps) => {
  return (
    <>
      <DemoAdminCard />
      <DemoUserCard />
    </>
  );
};

interface AuthPageLayoutProps {
  children: ReactNode;
  error?: string | null;
  title?: string;
  subtitle?: string;
}

export default function AuthPageLayout({ 
  children, 
  error, 
  title = "Welcome Back", 
  subtitle = "Access your secure manufacturing portal" 
}: AuthPageLayoutProps) {
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
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
        <div className="w-full max-w-7xl">
          {/* Security Badge */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center bg-blue-900/30 border border-blue-700/50 rounded-full px-4 py-2 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Enterprise-grade security
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Auth Layout - Responsive Layout */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
            {/* Auth Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 shadow-2xl w-full max-w-md">
              {/* Welcome Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
                <p className="text-gray-400 text-sm sm:text-base">{subtitle}</p>
              </div>

              {/* Form Content */}
              {children}
            </div>

            {/* Demo Credentials - Centered on mobile, flex on laptop */}
            <div className="w-full max-w-4xl">
              <div className="flex flex-col lg:flex-row gap-6 justify-center">
                <DemoCredentials />
              </div>
              
              {/* Email Notification Note */}
              <div className="mt-6 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  {/* Email Notification Feature */}
                  <div className="flex items-start gap-3 flex-1">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-300 mb-1">Live Email Notifications</h4>
                      <p className="text-xs text-yellow-200">
                        Email notifications are sent to users when quote or RFQ status changes. The demo user account receives real emails.
                      </p>
                    </div>
                  </div>
                  {/* Social Login Feature */}
                  <div className="flex items-start gap-3 flex-1 mt-4 sm:mt-0">
                    <svg className="w-5 h-5 text-blue-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-200 mb-1">Social Login <span role="img" aria-label="bolt"></span></h4>
                      <p className="text-xs text-blue-100">
                        Sign in with Google, GitHub, LinkedIn for instant access. Social login is available for all users.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Footer */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center text-xs text-gray-500 mb-2">
              <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure authentication powered by Supabase. SOC 2 Type II compliant.
            </div>
            <p className="text-xs text-gray-600">
              Trusted by 500+ manufacturers worldwide • ITAR compliant facility
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Social Login Buttons Component
export const SocialLoginButtons = ({ 
  onSocialLogin, 
  loading 
}: { 
  onSocialLogin: (provider: string) => void; 
  loading: boolean; 
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => onSocialLogin('Google')}
        disabled={loading}
        className="flex items-center justify-center p-3 bg-gray-700/50 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed border border-gray-600 rounded-lg transition-colors group"
        title="Continue with Google"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onSocialLogin('GitHub')}
        disabled={loading}
        className="flex items-center justify-center p-3 bg-gray-700/50 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed border border-gray-600 rounded-lg transition-colors group"
        title="Continue with GitHub"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onSocialLogin('LinkedIn')}
        disabled={loading}
        className="flex items-center justify-center p-3 bg-gray-700/50 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed border border-gray-600 rounded-lg transition-colors group"
        title="Continue with LinkedIn"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </button>
    </div>
  );
};
