#!/bin/bash

# Script to clear browser cookies and site data for localhost
# This can help when troubleshooting auth issues in Safari

echo "🍪 Safari Cookie and Storage Cleaner"
echo "===================================="
echo
echo "This script will help you clean up Safari's storage."
echo "Follow these manual steps:"
echo
echo "1. Open Safari Preferences/Settings"
echo "2. Go to Privacy tab"
echo "3. Click 'Manage Website Data...'"
echo "4. Search for 'localhost'"
echo "5. Select and click 'Remove' to clear cookies and storage"
echo "6. Restart Safari"
echo
echo "For a more thorough cleaning:"
echo "1. Go to Safari > Settings > Advanced"
echo "2. Check 'Show Develop menu in menu bar'"
echo "3. Go to Develop > Empty Caches (Opt+Cmd+E)"
echo "4. Go to Safari > Settings > Privacy"
echo "5. Click 'Manage Website Data'"
echo "6. Remove all website data or search for your domain"
echo

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Would you like to open Safari preferences now? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    open "x-apple.systempreferences:com.apple.Safari-Privacy"
  fi
else
  echo "This script is designed for macOS. Please follow the manual steps above."
fi

echo
echo "✨ Done!"
