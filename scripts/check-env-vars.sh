#!/bin/bash

# A script to check if your NextAuth environment variables are set correctly

echo "NextAuth Environment Variable Checker"
echo "===================================="
echo

# Check if NEXTAUTH_URL is set
if [ -z "$NEXTAUTH_URL" ]; then
  echo "❌ NEXTAUTH_URL is not set"
else
  echo "✅ NEXTAUTH_URL is set to: $NEXTAUTH_URL"
fi

# Check if NEXTAUTH_SECRET is set
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ NEXTAUTH_SECRET is not set"
else
  echo "✅ NEXTAUTH_SECRET is set (value hidden for security)"
fi

# Check if GOOGLE_CLIENT_ID is set
if [ -z "$GOOGLE_CLIENT_ID" ]; then
  echo "❌ GOOGLE_CLIENT_ID is not set"
else
  echo "✅ GOOGLE_CLIENT_ID is set (value hidden for security)"
  # Show first few characters to help identify
  echo "   First few characters: ${GOOGLE_CLIENT_ID:0:8}..."
fi

# Check if GOOGLE_CLIENT_SECRET is set
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "❌ GOOGLE_CLIENT_SECRET is not set"
else
  echo "✅ GOOGLE_CLIENT_SECRET is set (value hidden for security)"
  # Show first few characters to help identify
  echo "   First few characters: ${GOOGLE_CLIENT_SECRET:0:4}..."
fi

echo
echo "If any variables show as not set, you need to fix your .env.local file"
echo "Run ./scripts/setup-google-oauth.sh to set up your Google OAuth credentials"
echo
echo "To verify these variables are available to your Node.js app, run:"
echo "node -e 'console.log(\"GOOGLE_CLIENT_ID: \" + !!process.env.GOOGLE_CLIENT_ID)'"
echo
