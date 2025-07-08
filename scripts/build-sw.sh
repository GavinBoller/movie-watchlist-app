#!/bin/bash

# Build script for Service Worker TypeScript compilation
# This compiles src/sw.ts to public/sw.js

echo "Building Service Worker..."

# Check if TypeScript compiler is available
if ! command -v tsc &> /dev/null; then
    echo "TypeScript compiler not found. Installing..."
    npm install -g typescript
fi

# Compile the Service Worker
npx tsc src/sw.ts \
    --target ES2018 \
    --lib ES2018,WebWorker \
    --module ESNext \
    --moduleResolution node \
    --outDir public \
    --skipLibCheck \
    --strict \
    --noEmit false

# Move the compiled file to the correct location
if [ -f "public/sw.js" ]; then
    echo "✓ Service Worker compiled successfully: public/sw.js"
else
    echo "✗ Service Worker compilation failed"
    exit 1
fi
