#!/bin/bash

# Get IP address (platform-independent way)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
else
  # Linux
  IP_ADDRESS=$(hostname -I | awk '{print $1}')
fi

echo "==============================================="
echo "Building and starting your application..."
echo "==============================================="

# Build the application
npm run build

if [ $? -eq 0 ]; then
  echo "==============================================="
  echo "Build successful! Starting server..."
  echo "==============================================="
  
  # Start the server
  npm run start
  
  echo "==============================================="
  echo "To access your app from an iOS device:"
  echo "==============================================="
  echo "1. Ensure your iPhone is connected to the same WiFi network as this computer"
  echo "2. Open Safari on your iPhone and go to:"
  echo "   https://$IP_ADDRESS:3000"
  echo "3. You might see a warning about an untrusted certificate - click 'Advanced' and 'Proceed'"
  echo "4. To add as a PWA, tap the share button, then 'Add to Home Screen'"
  echo "==============================================="
else
  echo "Build failed. Please fix the errors and try again."
fi
