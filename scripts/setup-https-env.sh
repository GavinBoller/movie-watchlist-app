#!/bin/bash

# Create a .env.local file with HTTPS-related environment variables
cat << EOF > .env.local
# NextAuth Configuration
NEXTAUTH_URL=https://localhost:3000
NEXT_PUBLIC_USE_HTTPS=true

# Copy your existing environment variables
$(grep -v "NEXTAUTH_URL\|NEXT_PUBLIC_USE_HTTPS" .env 2>/dev/null)
EOF

echo "Created .env.local with HTTPS configuration"
echo "To start your app with HTTPS enabled, run: npm run dev:https"
