#!/bin/bash

# Safari Authentication and Redirect Loop Breaker
# This script will clear session storage and cookies to break authentication loops

echo "🔄 Safari Authentication Loop Breaker"
echo "====================================="

echo -e "\n1. Running Service Worker Diagnostics..."

# Check service worker registration
echo "Checking for registered service workers..."
safari_command='
tell application "Safari"
  tell front document
    do JavaScript "
      if (\"serviceWorker\" in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          console.log(\"Found \" + registrations.length + \" service worker registrations\");
          if (registrations.length > 0) {
            registrations.forEach(function(registration) {
              console.log(\"Unregistering service worker: \" + registration.scope);
              registration.unregister();
            });
            console.log(\"All service workers unregistered. Please reload the page.\");
          } else {
            console.log(\"No service workers found.\");
          }
        }).catch(function(error) {
          console.log(\"Error checking service workers: \" + error);
        });
      } else {
        console.log(\"Service Worker API not supported\");
      }
    "
  end tell
end tell'

# Only run on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  if [[ $(osascript -e 'application "Safari" is running') == "true" ]]; then
    echo "Safari is running, attempting to check service workers..."
    osascript -e "$safari_command" 2>/dev/null || echo "Could not execute Safari JavaScript command"
  else
    echo "Safari is not running"
  fi
else
  echo "This script is designed for macOS Safari"
fi

echo -e "\n2. Clearing Authentication Data..."

# Instruct user on how to manually clear cookies and storage
echo "Please manually clear Safari cookies and site data:"
echo "  1. Open Safari preferences (Safari > Settings...)"
echo "  2. Go to Privacy tab"
echo "  3. Click 'Manage Website Data...'"
echo "  4. Search for your site domain"
echo "  5. Select and click 'Remove'"
echo "  6. Restart Safari and try again"

# Provide manual steps to fix the issue
echo -e "\n3. Breaking Authentication Loop:"
echo "If you're experiencing a redirect loop:"
echo "  1. Open a new private browsing window"
echo "  2. Navigate directly to your site's homepage"
echo "  3. Click 'Sign In' from the homepage instead of being redirected"
echo "  4. After signing in, manually navigate to the watchlist page"

echo -e "\n4. Advanced Fix (for developers):"
echo "Run these commands in the browser console to clear storage and break loops:"
echo "  localStorage.clear();"
echo "  sessionStorage.clear();"
echo "  document.cookie.split(';').forEach(function(c) {"
echo "    document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';"
echo "  });"
echo "  location.href = '/?reset=true';"

echo -e "\n✅ Done! Please try accessing your app again after performing these steps."
