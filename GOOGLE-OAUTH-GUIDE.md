# Google OAuth Setup for Movie Watchlist App

This guide will help you correctly set up Google OAuth for your app to fix the authentication issues in Safari.

## The Issue

You're seeing the error `[TypeError: client_id is required]` because the app can't find your Google OAuth credentials. This happens when:

1. The credentials are missing from your environment variables
2. There's an issue with how NextAuth is reading those variables
3. The credentials are invalid or have the wrong redirect URI

## Step 1: Create Google OAuth Credentials

If you haven't already created OAuth credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click "Create Credentials" > "OAuth client ID"
4. Application type: "Web application"
5. Add authorized JavaScript origins:
   - `https://localhost:3000`
6. Add authorized redirect URIs:
   - `https://localhost:3000/api/auth/callback/google`
7. Click "Create"
8. Copy the Client ID and Client Secret

## Step 2: Set Up Environment Variables

You have two options:

### Option A: Use the Setup Script (Recommended)

Run our helper script:

```bash
./scripts/setup-google-oauth.sh
```

Follow the prompts to enter your Google client ID and client secret.

### Option B: Manually Update .env.local

Edit your `.env.local` file and ensure it contains:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://localhost:3000
NEXT_PUBLIC_USE_HTTPS=true
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database Configuration (your existing settings)
DATABASE_URL=...
SHADOW_DATABASE_URL=...
```

## Step 3: Verify Environment Variable Loading

To make sure your environment variables are being loaded correctly:

1. Stop your current server
2. Start the server with explicit environment variables:

```bash
GOOGLE_CLIENT_ID=your-client-id GOOGLE_CLIENT_SECRET=your-client-secret npm run dev:https
```

## Step 4: Debug Mode

We've added enhanced debugging to help diagnose OAuth issues. Check your console logs for:

- "Auth Config Debug" messages that show if your credentials are being loaded
- Detailed OAuth error information
- Sign-in attempt logs

## Troubleshooting

If you still encounter issues:

1. **Check Redirect URIs**: Make sure the redirect URI in Google Cloud Console exactly matches `https://localhost:3000/api/auth/callback/google`

2. **Enable Required APIs**: In Google Cloud Console, make sure you've enabled:
   - Google+ API 
   - Google People API

3. **Check for CORS Issues**: Ensure your browser isn't blocking cookies or has CORS issues

4. **Clear Browser Data**: In Safari, go to Preferences > Privacy > Manage Website Data, and remove data for localhost

5. **Use a Private/Incognito Window**: This eliminates extensions or cached data that might interfere

6. **Check Safari Developer Console**: Look for any errors related to cookies or authentication

## Next Steps

After updating your environment variables, restart your server:

```bash
npm run dev:https
```

Then try signing in again with Google.
