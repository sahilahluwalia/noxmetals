import { updateSession } from "./app/utils/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // ✅ Only match routes that actually need auth checking
    '/dashboard/:path*',
    '/admin/:path*', 
    '/profile/:path*'
  ],
};