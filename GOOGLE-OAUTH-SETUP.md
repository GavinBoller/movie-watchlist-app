# Setting Up Google OAuth for Your Movie Watchlist App

This guide will help you set up Google OAuth for your movie watchlist app, which is necessary for the Google authentication to work properly.

## 1. Create OAuth Credentials in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Set the application type to "Web application"
6. Add a name for your OAuth client
7. Add authorized JavaScript origins:
   - `https://localhost:3000` (for local development)
   - Your production domain if deployed
8. Add authorized redirect URIs:
   - `https://localhost:3000/api/auth/callback/google` (for local development)
   - Your production domain equivalent if deployed
9. Click "Create"
10. Note your Client ID and Client Secret

## 2. Add Credentials to Your Environment Variables

1. Open the `.env.local` file in your project root
2. Add or update the following variables:

```
GOOGLE_CLIENT_ID=your-client-id-from-google-cloud-console
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-cloud-console
NEXTAUTH_SECRET=random-secret-key-at-least-32-characters-long
```

3. For the `NEXTAUTH_SECRET`, you can generate a random string using:
   ```bash
   openssl rand -base64 32
   ```

## 3. Restart Your Development Server

```bash
# First, make sure to stop any running server
# Then start with HTTPS:
npm run dev:https
```

## Troubleshooting

If you continue to see the error `client_id is required`:

1. Verify your `.env.local` file has the correct variables
2. Check that there are no spaces around the `=` sign in your environment variables
3. Ensure the variable names are exactly as shown above
4. Make sure you've restarted your server after changing environment variables

## Note for Safari

Safari has stricter security requirements than other browsers. When testing:

1. Make sure you're using HTTPS with a trusted certificate
2. Clear Safari cookies if you encounter persistent issues
3. Try using an incognito/private window for testing
