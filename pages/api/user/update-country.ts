// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../auth/[...nextauth]';
import { secureApiHandler } from '../../../lib/secureApiHandler';
import { userUpdateCountrySchema } from '../../../lib/schemas/user';

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { country } = req.body;
  const userId = req.session.user.id;

  try {
    const { Pool } = require('@neondatabase/serverless');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Update the user's country in the database
    await pool.query(
      'UPDATE users SET country = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
      [country, userId]
    );

    await pool.end();

    console.log(`Successfully updated country to ${country} for user ${userId}`);

    return res.status(200).json({ success: true, country: country });

  } catch (error) {
    console.error('Error updating user country in database:', error);
    throw error; // Let secureApiHandler handle this error
  }
}

export default secureApiHandler(handler, {
  allowedMethods: ['PUT'],
  requireAuth: true,
  validationSchema: userUpdateCountrySchema
});