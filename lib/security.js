import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import NodeCache from 'node-cache';

// Cache to store rate limiting data
const rateLimit = new NodeCache({ stdTTL: 60 }); // Default TTL of 60 seconds

/**
 * Rate limiting middleware for Next.js API routes
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Time window in seconds
 * @param {number} options.limit - Maximum requests per interval
 * @param {string[]} options.methods - HTTP methods to limit (defaults to all)
 * @param {string[]} options.excludePaths - API paths to exclude from rate limiting
 * @returns {Function} Middleware function
 */
export function rateLimiter(options = {}) {
  const {
    interval = 60, // Default: 1 minute window
    limit = 60,    // Default: 60 requests per minute
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    excludePaths = [],
  } = options;

  return async function(req, res, next) {
    // Check if the path should be excluded
    const path = req.url.split('?')[0];
    if (excludePaths.some(excludePath => path.startsWith(excludePath))) {
      return next ? next() : null;
    }

    // Check if the method should be rate limited
    if (!methods.includes(req.method)) {
      return next ? next() : null;
    }

    // Get user ID from session or use IP address for non-authenticated routes
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    
    // Use user ID if available, otherwise IP
    // X-Forwarded-For can be a comma-separated list, so we take the first one
    const clientIp = 
      (req.headers['x-forwarded-for'] || '').split(',').shift().trim() ||
      req.socket.remoteAddress;
    
    const identifier = userId || clientIp || 'unknown';
    const key = `ratelimit:${identifier}`;
    
    // Get current rate limiting data
    let rateData = rateLimit.get(key) || { count: 0, resetTime: Date.now() + interval * 1000 };
    
    // Check if the window has expired and reset if needed
    if (Date.now() > rateData.resetTime) {
      rateData = { count: 0, resetTime: Date.now() + interval * 1000 };
    }
    
    // Increment request count
    rateData.count += 1;
    
    // Store updated data
    rateLimit.set(key, rateData);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - rateData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateData.resetTime / 1000));
    
    // If limit exceeded, return 429 Too Many Requests
    if (rateData.count > limit) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((rateData.resetTime - Date.now()) / 1000)} seconds.`
      });
    }
    
    // Continue to the API route handler
    return next ? next() : null;
  };
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {any} input - Input to sanitize
 * @returns {any} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Replace potentially dangerous characters
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } else if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  } else if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

/**
 * Validates input against a schema
 * @param {Object} input - Input to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
export function validateInput(input, schema) {
  // If schema is null or undefined, skip validation
  if (!schema) {
    return { isValid: true, value: input };
  }
  
  const errors = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = input[field];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    // Skip further validation if value is not provided and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    // Validate type
    if (rules.type && typeof value !== rules.type) {
      errors[field] = `${field} must be a ${rules.type}`;
      continue;
    }
    
    // Validate enum values
    if (rules.enum && !rules.enum.includes(value)) {
      errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
      continue;
    }
    
    // Validate min/max for numbers
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors[field] = `${field} must be greater than or equal to ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        errors[field] = `${field} must be less than or equal to ${rules.max}`;
      }
    }
    
    // Validate min/max length for strings
    if (rules.type === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`;
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors[field] = `${field} has an invalid format`;
      }
    }
  }
  
  return { 
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
