// This middleware runs after authentication callbacks to ensure session state is properly synced
import { NextResponse } from 'next/server';

// Listen for Google OAuth callback completions
export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a callback from Google OAuth
  if (pathname.startsWith('/api/auth/callback/google')) {
    // Get the destination URL from the request
    const redirectUrl = new URL('/api/auth/session-refresh', request.url);
    
    // Add the original destination as a parameter
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/search';
    redirectUrl.searchParams.set('callbackUrl', callbackUrl);
    
    // Redirect to our session refresh endpoint
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

// Only apply this middleware to Google OAuth callbacks
export const config = {
  matcher: ['/api/auth/callback/google'],
};
