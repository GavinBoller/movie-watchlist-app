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
    // Apply to all non-API routes for security headers
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};

export function middleware(request) {
  const response = NextResponse.next();
  
  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Only apply rate limiting to API routes
  const url = request.nextUrl.pathname;
  if (url.startsWith('/api')) {
    // Skip rate limiting for auth endpoints
    if (url.startsWith('/api/auth/')) {
      return response;
    }
    
    const clientId = getClientIdentifier(request);
    const method = request.method;
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

// Note: Middleware in Edge Runtime cannot use setInterval.
// Cleanup will be handled by natural garbage collection.
