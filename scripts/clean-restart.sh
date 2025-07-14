#!/bin/bash

# Safari Cache Cleaner and App Restart
# A comprehensive tool to clean up Safari's cache and restart your app

echo "🧹 Safari Cache Cleaner and App Restart"
echo "======================================"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "❌ This script is designed for macOS only."
  exit 1
fi

# Stop any running Next.js servers
echo -e "\n1️⃣ Stopping any running Next.js servers..."
pkill -f "node.*next"
echo "✅ Next.js servers stopped"

# Clear Safari cache using osascript if Safari is running
if [[ $(osascript -e 'application "Safari" is running') == "true" ]]; then
  echo -e "\n2️⃣ Safari is running, attempting to clear cache..."
  
  # Open Develop menu and Empty Caches
  osascript <<EOD
  tell application "System Events"
    tell process "Safari"
      set frontmost to true
      delay 0.5
      tell menu bar 1
        tell menu bar item "Develop"
          click
          delay 0.2
          tell menu "Develop"
            click menu item "Empty Caches"
          end tell
        end tell
      end tell
    end tell
  end tell
EOD
  
  if [ $? -eq 0 ]; then
    echo "✅ Safari caches cleared"
  else
    echo "⚠️ Could not automatically clear Safari caches."
    echo "   Please manually clear them from Develop > Empty Caches"
  fi
else
  echo -e "\n2️⃣ Safari is not running"
fi

# Clear out temporary Next.js build files
echo -e "\n3️⃣ Clearing Next.js build cache..."
if [ -d ".next" ]; then
  rm -rf .next
  echo "✅ .next directory removed"
else
  echo "⚠️ .next directory not found"
fi

# Clear node_modules cache (optional)
echo -e "\n4️⃣ Do you want to clear node_modules and reinstall dependencies? (y/n)"
read -r clear_modules
if [[ "$clear_modules" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "Removing node_modules..."
  rm -rf node_modules
  rm -f package-lock.json
  
  echo "Reinstalling dependencies..."
  npm install
  echo "✅ Dependencies reinstalled"
fi

# Restart in development mode
echo -e "\n5️⃣ Starting development server with HTTPS..."
npm run dev:https &

echo -e "\n✅ Done! Your app should now be running with a clean state."
echo "🌐 Open Safari and navigate to https://localhost:3000"
echo "⚠️ Remember to enable Developer menu in Safari preferences if not already enabled."
