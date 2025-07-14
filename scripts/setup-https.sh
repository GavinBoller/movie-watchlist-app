#!/bin/bash

# Generate certificates for localhost
echo "Generating certificates for localhost..."
mkdir -p certificates

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed. Please install it first:"
    echo "  brew install mkcert"
    exit 1
fi

# Generate certificates
mkcert -key-file ./certificates/key.pem -cert-file ./certificates/cert.pem localhost 127.0.0.1 ::1

# Install the local CA if not already installed
echo "Installing local CA (may require password)..."
mkcert -install

# Create environment file
echo "Creating .env.local with HTTPS configuration..."
cat << EOF > .env.local
# NextAuth Configuration
NEXTAUTH_URL=https://localhost:3000
NEXT_PUBLIC_USE_HTTPS=true

# Copy existing environment variables
$(grep -v "NEXTAUTH_URL\|NEXT_PUBLIC_USE_HTTPS" .env 2>/dev/null)
EOF

echo ""
echo "✅ HTTPS setup complete!"
echo ""
echo "To start your app with HTTPS:"
echo "  npm run dev:https"
echo ""
echo "If you encounter issues in Safari:"
echo "  1. Make sure certificates are trusted in Keychain Access"
echo "  2. Clear Safari cookies for localhost"
echo "  3. Check the console for debugging information"
echo ""
