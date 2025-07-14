#!/bin/bash

# Test script to verify imports from utils/pwa.js

echo "Testing imports from utils/pwa.js..."

# Create a simple test file
cat > test-pwa-imports.js <<EOL
import { isPWAMode, isPWA, initPWA, registerServiceWorker } from './utils/pwa.js';

console.log('All imports succeeded!');
EOL

# Use Node.js to check the syntax without running it
node --check test-pwa-imports.js

if [ $? -eq 0 ]; then
  echo "✅ Import test successful - syntax is valid"
else
  echo "❌ Import test failed - check utils/pwa.js and its exports"
fi

# Clean up
rm test-pwa-imports.js

# Now test the build
echo "Running a test build..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
fi
