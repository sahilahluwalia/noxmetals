import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  // ✅ Skip auth check for static files and API routes  
  const isStaticFile = request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|js|css|woff|woff2|ttf|otf)$/);
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  if (isStaticFile || isApiRoute) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ✅ Use getUser() instead of getClaims() for better performance
  const { data: { user } } = await supabase.auth.getUser();

  // Only redirect to auth if user is accessing protected routes without authentication
  // Allow public routes and don't interfere with auth refresh process
  const isPublicRoute = request.nextUrl.pathname === "/" || 
                       request.nextUrl.pathname.startsWith("/signup") ||
                       request.nextUrl.pathname.startsWith("/auth") ||
                       request.nextUrl.pathname.startsWith("/contact") ||
                       request.nextUrl.pathname.startsWith("/privacy") ||
                       request.nextUrl.pathname.startsWith("/terms") ||
                       request.nextUrl.pathname.startsWith("/api/");

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
                          request.nextUrl.pathname.startsWith("/admin") ||
                          request.nextUrl.pathname.startsWith("/profile");

  // Only redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}