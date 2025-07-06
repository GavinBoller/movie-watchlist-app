import { rateLimiter } from '../lib/security';

// Apply rate limiting to all API routes
export default function middleware(req, res) {
  // Different rate limits for different types of requests
  const path = req.url.split('?')[0];
  
  // Higher limits for read operations (GET)
  if (req.method === 'GET') {
    return rateLimiter({
      interval: 60, // 1 minute window
      limit: 120,   // 120 requests per minute for GET
      methods: ['GET'],
      excludePaths: ['/api/auth/'] // Don't rate limit auth endpoints
    })(req, res);
  }
  
  // Stricter limits for write operations (POST, PUT, DELETE)
  return rateLimiter({
    interval: 60, // 1 minute window
    limit: 30,    // 30 requests per minute for write operations
    methods: ['POST', 'PUT', 'DELETE', 'PATCH'],
    excludePaths: ['/api/auth/'] // Don't rate limit auth endpoints
  })(req, res);
}

// Configure which paths this middleware applies to
export const config = {
  matcher: '/api/:path*',
};
