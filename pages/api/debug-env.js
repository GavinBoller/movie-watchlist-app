// @ts-nocheck
export default function handler(req, res) {
  // For security, we'll only show if the key exists, not the actual value
  const tmdbKeyExists = !!process.env.TMDB_API_KEY;
  const tmdbKeyFirstChars = process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.substring(0, 4) + '...' : null;
  
  res.status(200).json({
    status: 'ok',
    env: process.env.NODE_ENV,
    variables: {
      tmdbKeyExists,
      tmdbKeyFirstChars,
      nextAuthUrl: process.env.NEXTAUTH_URL || null,
      databaseUrlExists: !!process.env.DATABASE_URL
    }
  });
}
