#!/bin/bash

# Safari/PWA troubleshooting script
# Run this script to diagnose common issues with PWA functionality in Safari

echo "🔍 Safari PWA Troubleshooting Tool"
echo "=================================="

# Check HTTPS configuration
echo -e "\n✅ Checking HTTPS configuration..."
if [[ -f ".env.local" ]]; then
  HTTPS_ENABLED=$(grep NEXT_PUBLIC_USE_HTTPS .env.local | cut -d= -f2)
  if [[ "$HTTPS_ENABLED" == "true" ]]; then
    echo "  ✓ HTTPS is enabled (NEXT_PUBLIC_USE_HTTPS=true)"
  else
    echo "  ✗ HTTPS is not enabled. Add NEXT_PUBLIC_USE_HTTPS=true to .env.local"
  fi
else
  echo "  ✗ .env.local file not found. Create it with NEXT_PUBLIC_USE_HTTPS=true"
fi

# Check for mkcert
echo -e "\n✅ Checking mkcert installation..."
if command -v mkcert &> /dev/null; then
  echo "  ✓ mkcert is installed"
  
  # Check for local certificates
  if [[ -f "localhost.pem" && -f "localhost-key.pem" ]]; then
    echo "  ✓ Local certificates found"
  else
    echo "  ✗ Local certificates not found. Run: mkcert localhost"
  fi
else
  echo "  ✗ mkcert not installed. Install with: brew install mkcert"
  echo "    Then run: mkcert -install && mkcert localhost"
fi

# Check NextAuth configuration
echo -e "\n✅ Checking NextAuth configuration..."
if [[ -f ".env.local" ]]; then
  NEXTAUTH_URL=$(grep NEXTAUTH_URL .env.local | cut -d= -f2)
  if [[ "$NEXTAUTH_URL" == https* ]]; then
    echo "  ✓ NEXTAUTH_URL is set to use HTTPS: $NEXTAUTH_URL"
  else
    echo "  ✗ NEXTAUTH_URL must use HTTPS. Update in .env.local"
  fi
else
  echo "  ✗ .env.local file not found"
fi

# Check Google OAuth configuration
echo -e "\n✅ Checking Google OAuth configuration..."
if [[ -f ".env.local" ]]; then
  GOOGLE_CLIENT_ID=$(grep GOOGLE_CLIENT_ID .env.local | cut -d= -f2)
  GOOGLE_CLIENT_SECRET=$(grep GOOGLE_CLIENT_SECRET .env.local | cut -d= -f2)
  
  if [[ -n "$GOOGLE_CLIENT_ID" && -n "$GOOGLE_CLIENT_SECRET" ]]; then
    echo "  ✓ Google OAuth credentials found"
  else
    echo "  ✗ Google OAuth credentials missing or incomplete"
  fi
else
  echo "  ✗ .env.local file not found"
fi

# Check manifest.json
echo -e "\n✅ Checking PWA manifest..."
if [[ -f "public/manifest.json" ]]; then
  echo "  ✓ manifest.json file found"
  
  # Validate manifest contents
  if grep -q "\"display\":" "public/manifest.json" && grep -q "\"start_url\":" "public/manifest.json"; then
    echo "  ✓ manifest.json appears to have required fields"
  else
    echo "  ✗ manifest.json may be missing required fields"
  fi
else
  echo "  ✗ manifest.json not found in public directory"
fi

# Check service worker
echo -e "\n✅ Checking service worker..."
if [[ -f "public/sw.js" ]]; then
  echo "  ✓ Service worker file found"
else
  echo "  ✗ Service worker file not found in public directory"
fi

# Check for _document.js/_document.tsx
echo -e "\n✅ Checking document configuration..."
if [[ -f "pages/_document.js" || -f "pages/_document.tsx" ]]; then
  echo "  ✓ _document file found"
  
  # Check for PWA meta tags
  if [[ -f "pages/_document.js" ]]; then
    DOC_FILE="pages/_document.js"
  else
    DOC_FILE="pages/_document.tsx"
  fi
  
  if grep -q "apple-mobile-web-app" "$DOC_FILE"; then
    echo "  ✓ PWA meta tags found in document file"
  else
    echo "  ✗ PWA meta tags may be missing in document file"
  fi
else
  echo "  ✗ _document file not found in pages directory"
fi

# Generate recommendations
echo -e "\n🚀 Recommendations:"
echo "1. Ensure you're running the app with 'npm run dev:https' for local HTTPS"
echo "2. In Safari, go to Develop > Web Application > Service Workers to debug"
echo "3. Check Safari's privacy settings for cookies and site data"
echo "4. Try clearing Safari's cache and website data if problems persist"
echo "5. Make sure the certificate is trusted in macOS Keychain Access"

echo -e "\n📝 Safari Cookie/Storage Access:"
echo "Safari has strict cookie and storage access policies. For apps to maintain"
echo "session when using as a PWA, you may need to address these issues:"
echo "1. Use secure cookies only (httpOnly: true, secure: true)"
echo "2. Ensure sameSite is set to 'lax' for auth cookies"
echo "3. Keep JWT expiration longer for Safari (30+ days recommended)"

echo -e "\n✨ Done!"
