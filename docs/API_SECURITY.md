# API Security Improvements

This document outlines the security improvements implemented for the Movie Watchlist application's API.

## Overview of Implemented Security Features

### 1. Input Validation and Sanitization

- All user inputs are validated using schema-based validation
- Input sanitization to prevent XSS attacks
- Type checking and constraint validation

### 2. Rate Limiting

- API-wide rate limiting to prevent abuse
- Different limits for read operations (120 req/min) and write operations (30 req/min)
- Per-user and per-IP rate limiting

### 3. Error Handling

- Consistent error response format
- Limited error details in production environment
- Appropriate HTTP status codes

### 4. HTTP Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictions

### 5. SQL Injection Prevention

- Parameterized queries for all database operations
- Input sanitization for search queries
- Enhanced text search security

## Implementation Details

### Security Middleware (`lib/security.js`)

Contains utility functions for:
- Rate limiting
- Input sanitization
- Input validation

### Secure API Handler (`lib/secureApiHandler.js`)

Higher-order function that wraps API endpoints with:
- Method validation
- Security headers
- Authentication checks
- Input sanitization
- Input validation
- Error handling

### Edge Middleware (`middleware.js`)

Adds security headers to all API responses at the edge.

## Middleware Configuration

### Recent Improvements

- Fixed duplicate middleware function declaration issue
- Consolidated middleware functionality to a single root-level middleware.js file
- Updated middleware matcher to apply security headers to all routes while restricting rate limiting to API routes
- Configured middleware to skip rate limiting for authentication endpoints

### Middleware Features

- Provides consistent security headers for all responses
- Implements rate limiting for API routes
- Cleans up old rate limit entries periodically to prevent memory leaks

## API Handler Improvements

- Refactored API endpoints to use the secureApiHandler wrapper
- Created schema files for input validation
- Implemented consistent error handling across all endpoints

## API Validation Updates

### Joi Integration

- Added Joi validation library for robust schema validation
- Created schema files in `/lib/schemas/` directory for all API endpoints
- Enhanced security.js and secureApiHandler.js to support Joi schemas
- Added conditional validation based on HTTP method

### Schema Organization

- Created platform schemas in `/lib/schemas/platforms.js`
- Created user schemas in `/lib/schemas/user.js`
- Schemas follow a consistent pattern for validation

### Key Benefits

- Type checking and data validation
- Consistent error messages
- Clear separation of validation logic from business logic
- Improved maintainability through reusable schemas

## Usage Examples

### Adding Validation to an API Endpoint

```javascript
import { secureApiHandler } from '../../lib/secureApiHandler';

// Define validation schema
const watchlistSchema = {
  id: { required: true },
  title: { type: 'string', minLength: 1, maxLength: 500 },
  media_type: { type: 'string', enum: ['movie', 'tv'] },
  status: { type: 'string', enum: ['to_watch', 'watching', 'watched'] }
};

// Wrap handler with security features
export default secureApiHandler(
  async function handler(req, res) {
    // Your API logic here - inputs are already validated and sanitized
  }, 
  { 
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    validationSchema: watchlistSchema,
    requireAuth: true
  }
);
```

## Additional Security Considerations

1. **Database Security**
   - Always use parameterized queries
   - Limit database user permissions
   - Validate and sanitize all user inputs

2. **Authentication & Authorization**
   - Implement proper session management
   - Use HTTPS for all communications
   - Apply principle of least privilege

3. **Monitoring & Logging**
   - Log security-relevant events
   - Monitor for unusual patterns
   - Implement alerts for suspicious activity

## Installation

Run the script to install security-related packages:

```bash
./scripts/install-security-packages.sh
```
