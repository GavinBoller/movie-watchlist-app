// pages/api/test-env.js
export default function handler(req, res) {
  res.status(200).json({
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  });
}