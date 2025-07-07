import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

// API Rate limiting logic - using a simple in-memory store
// Note: In production, use a more persistent solution like Redis
const rateLimit = new Map();

// Helper function to get a string identifier for the client
function getClientIdentifier(req) {
  // Ideally, use authenticated user ID, but fall back to IP for unauthenticated requests
  // X-Forwarded-For can be a comma-separated list, so we take the first one
  const clientIp = req.headers.get('x-forwarded-for');
  const ip = clientIp ? clientIp.split(',')[0].trim() : 'unknown';
  
  return ip;
}

// Configure which paths this middleware applies to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to all non-API routes for security headers and auth
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'
  ]
};

export async function middleware(req) {
  const response = NextResponse.next();
  
  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy - Restrict external resource loading to trusted sources
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Allow inline scripts for now but can be tightened
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " + // Allow inline styles and Google Fonts CSS
    "img-src 'self' https://image.tmdb.org data:; " + // Allow TMDB images and data URIs
    "font-src 'self' https://fonts.gstatic.com data:; " + // Allow Google Fonts and embedded fonts
    "connect-src 'self' https://api.themoviedb.org; " + // Allow connection to TMDB API
    "frame-ancestors 'none'; " + // Prevent framing (similar to X-Frame-Options)
    "base-uri 'self'; " + // Restrict base URIs
    "form-action 'self'; " // Restrict form submissions
  );
  
  // Handle authentication and redirects
  const path = req.nextUrl.pathname;
  
  // Define which paths require authentication (all app functionality)
  const protectedPaths = ['/search', '/watchlist', '/settings'];
  
  // Check if the requested path is a protected route
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
  
  // Paths that are publicly accessible (don't redirect authenticated users away from these)
  const isPublicPath = path === '/auth/signin' || path === '/';

  // Get the token from the request
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Debug token information
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Path: ${path}, Token exists: ${!!token}`);
    if (token) {
      console.log('[Middleware] Token data:', {
        name: token.name,
        email: token.email,
        image: token.picture,
        expires: token.exp ? new Date(token.exp * 1000).toISOString() : 'unknown'
      });
    }
  }

  // Redirect logic for authentication
  if (isProtectedPath && !token) {
    // Redirect to home page (welcome/login) if trying to access protected routes without authentication
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isPublicPath && token && path !== '/search') {
    // Redirect to search page if already signed in and trying to access public pages
    // But only if they're not already trying to go to search
    return NextResponse.redirect(new URL('/search', req.url));
  }
  
  // Only apply rate limiting to API routes
  const url = req.nextUrl.pathname;
  if (url.startsWith('/api')) {
    // Skip rate limiting for auth endpoints
    if (url.startsWith('/api/auth/')) {
      return response;
    }
    
    const clientId = getClientIdentifier(req);
    const method = req.method;
    const key = `${clientId}:${method}:${url}`;
    
    // Get current rate limit data or create a new entry
    const now = Date.now();
    const rateData = rateLimit.get(key) || { 
      count: 0, 
      resetTime: now + 60000, // 1 minute window
      lastAccess: now 
    };
    
    // Reset counter if window has expired
    if (now > rateData.resetTime) {
      rateData.count = 0;
      rateData.resetTime = now + 60000;
    }
    
    // Increment request count
    rateData.count += 1;
    rateData.lastAccess = now;
    
    // Update rate limit data
    rateLimit.set(key, rateData);
    
    // Set rate limit headers
    const isReadMethod = method === 'GET';
    const limit = isReadMethod ? 120 : 30; // Higher limit for GET requests
    
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - rateData.count)));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateData.resetTime / 1000)));
    
    // Return 429 Too Many Requests if limit is exceeded
    if (rateData.count > limit) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((rateData.resetTime - now) / 1000)} seconds.`
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateData.resetTime / 1000)),
            'Retry-After': String(Math.ceil((rateData.resetTime - now) / 1000))
          }
        }
      );
    }
  }
  
  return response;
}
