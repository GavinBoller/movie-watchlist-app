#!/bin/bash

# setup-safari-dev.sh
# Script to set up and run a local HTTPS development environment for Safari PWA testing

echo "Setting up HTTPS development environment for Safari PWA testing..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert not found. Installing with Homebrew..."
    brew install mkcert
    
    if [ $? -ne 0 ]; then
        echo "Failed to install mkcert. Please install it manually: brew install mkcert"
        exit 1
    fi
fi

# Create certificates directory if it doesn't exist
mkdir -p certificates

# Install local CA
echo "Installing local CA in system trust store..."
mkcert -install

# Generate certificates for localhost
echo "Generating certificates for localhost..."
mkcert -key-file ./certificates/key.pem -cert-file ./certificates/cert.pem localhost

# Check if the custom server.js exists
if [ ! -f "./server.js" ]; then
    echo "Creating custom HTTPS server.js..."
    cat > server.js << 'EOL'
// server.js
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'cert.pem')),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
    console.log('> Open Safari and navigate to https://localhost:3000');
  });
});
EOL
fi

# Check if the dev:https script exists in package.json
if ! grep -q "dev:https" package.json; then
    echo "Adding dev:https script to package.json..."
    sed -i '' 's/"dev": "npm run build:sw && next dev",/"dev": "npm run build:sw && next dev",\n    "dev:https": "npm run build:sw && node server.js",/g' package.json
fi

# Clear Safari's HSTS cache
echo "Clearing Safari's HSTS cache..."
rm -f ~/Library/Cookies/HSTS.plist

echo "Starting HTTPS development server..."
echo "When Safari opens, navigate to https://localhost:3000"
npm run dev:https &

# Wait a moment for the server to start
sleep 3

# Open Safari
open -a Safari https://localhost:3000

echo "Done! Safari should open with your app over HTTPS."
echo "If you see certificate warnings, click 'Show Certificate' and trust it."
echo "Press Ctrl+C to stop the server when done."

# Keep the script running until interrupted
wait
