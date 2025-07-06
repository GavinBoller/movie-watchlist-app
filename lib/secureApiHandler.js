// secureApiHandler.js
import { sanitizeInput, validateInput } from './security';
import { validateWithJoi } from './validation';

/**
 * Higher-order function that wraps API handlers with security features
 * @param {Function} handler - The API handler function
 * @param {Object} options - Configuration options
 * @returns {Function} A wrapped handler with security enhancements
 */
export function secureApiHandler(handler, options = {}) {
  const { 
    allowedMethods = ['GET'], 
    validationSchema = null,
    requireAuth = false
  } = options;

  return async function(req, res) {
    // 1. HTTP Method Validation
    if (!allowedMethods.includes(req.method)) {
      res.setHeader('Allow', allowedMethods);
      return res.status(405).json({ 
        error: 'Method not allowed', 
        message: `The ${req.method} method is not supported for this endpoint` 
      });
    }

    // 2. Set Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 3. Authentication Check
    if (requireAuth) {
      try {
        const { getServerSession } = await import("next-auth/next");
        const { authOptions } = await import("../pages/api/auth/[...nextauth]");
        const session = await getServerSession(req, res, authOptions);
        
        if (!session || !session.user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Attach session to request for handler's use
        req.session = session;
      } catch (error) {
        console.error('Auth check error:', error);
        return res.status(500).json({ error: 'Authentication error' });
      }
    }

    // 4. Input Sanitization
    if (req.method === 'GET') {
      req.query = sanitizeInput(req.query);
    } else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      req.body = sanitizeInput(req.body);
    }

    // 5. Input Validation
    if (validationSchema) {
      const dataToValidate = req.method === 'GET' ? req.query : req.body;
      // Handle validation schema as a function that returns different schemas based on method
      const schema = typeof validationSchema === 'function' 
        ? validationSchema(req) 
        : validationSchema;
      
      // Use Joi validation for schemas that have a validate method, otherwise use our custom validator
      const validation = schema && typeof schema.validate === 'function'
        ? validateWithJoi(dataToValidate, schema)
        : validateInput(dataToValidate, schema);
      
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid input data', 
          details: validation.errors 
        });
      }
    }

    // 6. Error Handling Wrapper
    try {
      // Call the original handler
      return await handler(req, res);
    } catch (error) {
      console.error(`API Error in ${req.url}:`, error);
      
      // Don't expose detailed error messages in production
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Map common error types to appropriate status codes
      let statusCode = 500;
      if (error.name === 'ValidationError') statusCode = 400;
      else if (error.name === 'UnauthorizedError') statusCode = 401;
      else if (error.name === 'ForbiddenError') statusCode = 403;
      else if (error.name === 'NotFoundError') statusCode = 404;
      
      const errorMessage = isProduction 
        ? getGenericErrorMessage(statusCode) 
        : error.message || 'Unknown error';
      
      return res.status(statusCode).json({
        error: errorMessage,
        code: isProduction ? undefined : error.code || error.name
      });
    }
  };
}

/**
 * Returns a generic error message based on status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Generic error message
 */
function getGenericErrorMessage(statusCode) {
  switch (statusCode) {
    case 400: return 'Bad request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Resource not found';
    case 429: return 'Too many requests';
    default: return 'Internal server error';
  }
}
