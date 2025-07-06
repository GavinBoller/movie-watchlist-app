#!/bin/bash

# API Security Checker Script
# This script checks for common API security issues in the codebase

echo "🔍 Running API Security Check..."
echo "--------------------------------"

# Check for direct database access without authentication
echo "🔒 Checking for database operations without authentication..."
MISSING_AUTH=$(grep -r --include="*.js" "sql\`" ./pages/api/ | grep -v "session\|authenticatedUserId\|requireAuth" | wc -l)
if [ $MISSING_AUTH -gt 0 ]; then
  echo "⚠️  Warning: Found $MISSING_AUTH potential instances of database operations without authentication checks"
else
  echo "✅ No instances of unprotected database operations found"
fi

# Check for proper error handling
echo "🔒 Checking for proper error handling..."
MISSING_ERROR_HANDLING=$(grep -r --include="*.js" "catch" ./pages/api/ | grep -v "error\|throw" | wc -l)
if [ $MISSING_ERROR_HANDLING -gt 0 ]; then
  echo "⚠️  Warning: Found $MISSING_ERROR_HANDLING potential instances of missing error handling"
else
  echo "✅ No instances of missing error handling found"
fi

# Check for rate limiting configuration
echo "🔒 Checking for rate limiting implementation..."
if [ -f ./middleware.js ] && grep -q "rateLimit" ./middleware.js; then
  echo "✅ Rate limiting is configured"
else
  echo "⚠️  Warning: Rate limiting may not be properly configured"
fi

# Check for input validation
echo "🔒 Checking for input validation..."
SCHEMAS_COUNT=$(find ./lib/schemas -name "*.js" | wc -l)
if [ $SCHEMAS_COUNT -gt 0 ]; then
  echo "✅ Found $SCHEMAS_COUNT validation schema files"
else
  echo "⚠️  Warning: No validation schema files found"
fi

# Check for secure API handlers
echo "🔒 Checking for secure API handlers..."
SECURE_HANDLERS=$(grep -r --include="*.js" "secureApiHandler" ./pages/api/ | wc -l)
if [ $SECURE_HANDLERS -gt 0 ]; then
  echo "✅ Found $SECURE_HANDLERS endpoints using secureApiHandler"
else
  echo "⚠️  Warning: No secure API handlers found"
fi

# Check for input sanitization
echo "🔒 Checking for input sanitization..."
if grep -q "sanitizeInput" ./lib/security.js; then
  echo "✅ Input sanitization is implemented"
else
  echo "⚠️  Warning: Input sanitization may not be properly implemented"
fi

echo "--------------------------------"
echo "🔍 API Security Check Complete"
