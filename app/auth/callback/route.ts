import { NextResponse } from 'next/server';
import { createClient } from '../../utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Get the 'next' parameter for redirect, default to dashboard
  let next = searchParams.get('next') ?? '/dashboard';
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard';
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successfully exchanged code, check user and role
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          const userRole = roleData?.role || 'user';

          if (userRole === 'admin' || userRole === 'super_admin') {
            next = '/admin/dashboard';
          } else {
            next = '/dashboard';
          }
        }
      } catch (roleErr) {
        console.error('Error checking user role during callback:', roleErr);
        // Default to user dashboard if role check fails
        next = '/dashboard';
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    
    // If there was an error exchanging the code
    console.error('Error exchanging code for session:', error);
  }

  // No code found or error occurred - redirect to auth page
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`);
}
