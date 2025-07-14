#!/bin/bash

# Script to help set up Google OAuth credentials for the Movie Watchlist App

echo "Google OAuth Setup Helper"
echo "========================"
echo
echo "This script will help you set up your Google OAuth credentials."
echo "Please have your Google client ID and client secret ready."
echo

# Prompt for Google client ID
read -p "Enter your Google client ID: " google_client_id
if [ -z "$google_client_id" ]; then
  echo "Google client ID is required. Please run the script again."
  exit 1
fi

# Prompt for Google client secret
read -p "Enter your Google client secret: " google_client_secret
if [ -z "$google_client_secret" ]; then
  echo "Google client secret is required. Please run the script again."
  exit 1
fi

# Generate a random NextAuth secret if not provided
read -p "Enter a NextAuth secret (or press Enter to generate one): " nextauth_secret
if [ -z "$nextauth_secret" ]; then
  nextauth_secret=$(openssl rand -base64 32)
  echo "Generated NextAuth secret: $nextauth_secret"
fi

# Update .env.local file
cat > .env.local << EOF
# NextAuth Configuration
NEXTAUTH_URL=https://localhost:3000
NEXT_PUBLIC_USE_HTTPS=true
NEXTAUTH_SECRET=$nextauth_secret

# Google OAuth Credentials
GOOGLE_CLIENT_ID=$google_client_id
GOOGLE_CLIENT_SECRET=$google_client_secret

# Copy existing environment variables
DATABASE_URL=postgresql://neondb_owner:npg_ZeVSychT2G1i@ep-old-feather-a78inl7r-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
SHADOW_DATABASE_URL=postgresql://neondb_owner:npg_ZeVSychT2G1i@ep-old-feather-a78inl7r-pooler.ap-southeast-2.aws.neon.tech/neondb_shadow?sslmode=require&channel_binding=require
EOF

echo
echo "Successfully updated .env.local with your Google OAuth credentials!"
echo
echo "Important Notes:"
echo "1. Make sure you've set up redirect URIs in your Google Cloud Console:"
echo "   - https://localhost:3000/api/auth/callback/google"
echo "2. Restart your development server with: npm run dev:https"
echo "3. Your credentials are now saved in .env.local - never commit this file to version control"
echo
