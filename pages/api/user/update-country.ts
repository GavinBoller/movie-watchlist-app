// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../auth/[...nextauth]';
import { secureApiHandler } from '../../../lib/secureApiHandler';
import { userUpdateCountrySchema } from '../../../lib/schemas/user';

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { country } = req.body;
  const userId = req.session.user.id;
  const adapter = authOptions.adapter;

  // Check if the adapter and required methods are available
  if (!adapter || !adapter.updateUser) {
    throw new Error('NextAuth adapter or the updateUser method is not configured correctly.');
  }

  try {
    // Use the adapter to update the user in the database
    await adapter.updateUser({
      id: userId,
      country: country, // The field to update
    });

    // The session needs to be updated to reflect this change immediately.
    // Your CountrySelector component already handles this on the client-side with `updateSession`.
    // So, we just need to confirm success here.

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