// @ts-nocheck
// pages/api/test-env.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { secureApiHandler } from '../../lib/secureApiHandler';

function handler(req: NextApiRequest, res: NextApiResponse): void {
  // This endpoint should only be available in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden in production environment' });
  }
  
  res.status(200).json({
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV
  });
}

export default secureApiHandler(handler, {
  allowedMethods: ['GET'],
  requireAuth: false
});