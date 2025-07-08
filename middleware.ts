import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware function that runs before every request.
 * It checks if the user is authenticated and handles protected routes.
 */
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Create response
  const response = NextResponse.next();
  
  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy - Balanced security with Next.js compatibility
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const cspPolicy = [
    "default-src 'self'",
    `script-src 'self'${isDevelopment ? " 'unsafe-eval'" : ""}`, // Allow eval in dev for Next.js hot reloading
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow inline styles for Next.js CSS-in-JS
    "img-src 'self' https://image.tmdb.org https://*.googleusercontent.com data:", // TMDB images + Google profile images + data URIs
    "font-src 'self' https://fonts.gstatic.com data:", // Google Fonts + embedded fonts
    `connect-src 'self' https://api.themoviedb.org https://image.tmdb.org https://fonts.googleapis.com https://fonts.gstatic.com${isDevelopment ? " ws: wss:" : ""}`, // TMDB API + TMDB images + Google Fonts + WebSocket for dev
    "frame-ancestors 'none'", // Prevent framing (same as X-Frame-Options: DENY)
    "base-uri 'self'", // Restrict <base> element URLs
    "form-action 'self'", // Restrict form submissions
    "object-src 'none'", // Block plugins
    "upgrade-insecure-requests" // Upgrade HTTP to HTTPS
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspPolicy);
  
  // Define which paths require authentication
  const protectedPaths = ['/watchlist', '/settings'];
  
  // Check if the requested path is a protected route
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
  
  // Paths that are publicly accessible (don't redirect authenticated users away from these)
  const isPublicPath = path === '/auth/signin' || path === '/' || path === '/auth/signout';

  // Get the token from the request
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect logic
  if (isProtectedPath && !token) {
    // Redirect to signin if trying to access a protected route without authentication
    const url = new URL('/auth/signin', req.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  if (isPublicPath && token && path !== '/') {
    // Only redirect to search if not on home page to allow logout to work
    if (path === '/auth/signin') {
      return NextResponse.redirect(new URL('/search', req.url));
    }
  }

  // Return response with security headers
  return response;
}

/**
 * Configure which routes use this middleware
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
