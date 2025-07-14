# Setting up HTTPS for Local Development with Safari

This guide will help you configure your local development environment to use HTTPS, which is necessary for PWA features and Google Authentication to work properly in Safari.

## Prerequisites

1. Install `mkcert` to create trusted development certificates

```bash
# Using Homebrew on macOS
brew install mkcert
```

2. Setup mkcert's local CA

```bash
mkcert -install
```

**Note:** This might ask for your password to install the local CA in your system trust store

## Setup Steps

### 1. Generate certificates for localhost

Run the following command from your project root:

```bash
mkdir -p certificates
mkcert -key-file ./certificates/key.pem -cert-file ./certificates/cert.pem localhost 127.0.0.1 ::1
```

### 2. Create HTTPS environment variables

Run the provided script:

```bash
./scripts/setup-https-env.sh
```

This creates a `.env.local` file with the following settings:

- `NEXTAUTH_URL=https://localhost:3000`
- `NEXT_PUBLIC_USE_HTTPS=true`

### 3. Start your development server with HTTPS

```bash
npm run dev:https
```

This will start your Next.js application with HTTPS enabled.

## Troubleshooting Safari Authentication Issues

If you encounter issues with Google Authentication in Safari:

1. Ensure certificates are properly installed and trusted
   - Check Safari's security settings (padlock icon) to verify the certificate is trusted

2. Clear Safari cookies and website data
   - Safari > Preferences > Privacy > Manage Website Data...
   - Search for "localhost" and remove its data

3. Test in an incognito/private window
   - This helps rule out extension interference

4. Check Safari console for errors
   - Open Safari > Develop > Show JavaScript Console
   - (If the Develop menu is not visible, enable it in Safari > Preferences > Advanced)

5. Verify HSTS settings
   - If you've previously accessed your site with HTTP and HSTS is enabled, try:

   ```bash
   npx serve ./public -p 8000
   ```

   - Visit `https://localhost:8000` and accept the certificate

## Advanced Debugging

The app includes debugging utilities in `utils/auth-debug.js` that will automatically log authentication state information to the console when using HTTPS in development mode.

## Notes

- Safari has stricter security requirements than Chrome and Firefox
- OAuth callbacks require HTTPS in Safari, even for localhost
- Remember to trust your local certificates in Keychain Access
