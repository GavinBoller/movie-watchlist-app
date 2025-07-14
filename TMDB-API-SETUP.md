# Getting a TMDB API Key

Your app is failing to fetch genres because the TMDB API key is missing or invalid. Follow these steps to get a valid API key:

## Step 1: Create a TMDB Account

1. Go to [The Movie Database website](https://www.themoviedb.org/)
2. Click on "Join TMDB" in the top-right corner
3. Create an account and verify your email

## Step 2: Request an API Key

1. Once logged in, click on your profile icon in the top-right corner
2. Select "Settings" from the dropdown menu
3. In the left sidebar, click on "API"
4. Follow the link to "Request an API Key"
5. Select "Developer" as the type of use
6. Fill out the required information about your application
   - Application Name: Movie Watchlist App
   - Application URL: https://localhost:3000
   - Application Summary: Personal movie watchlist application
7. Accept the terms of use and click "Submit"

## Step 3: Add Your API Key to Your Environment

1. After approval, you'll be given an API Key (v3 auth)
2. Copy this key and add it to your `.env.local` file:

```
TMDB_API_KEY=your-api-key-here
```

3. Replace `your-api-key-here` with the actual key you received

## Step 4: Restart Your Server

After adding the API key to your `.env.local` file, restart your development server:

```bash
npm run dev:https
```

## Troubleshooting

If you still encounter issues:

1. Verify your API key is correct and properly added to `.env.local`
2. Check TMDB's status page for any API outages
3. Make sure your TMDB account is fully verified
4. Try creating a new API key if the current one doesn't work

Remember that TMDB has rate limits, so avoid making too many requests in a short period.
