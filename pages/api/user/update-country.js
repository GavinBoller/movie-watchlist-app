import { getServerSession } from 'next-auth/next';
// IMPORTANT: You may need to adjust this path to point to your NextAuth configuration file.
// It is usually located at '/pages/api/auth/[...nextauth].js' or a similar path in your project.
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'You must be signed in to update your country.' });
  }

  const { country } = req.body;

  // Basic validation for the country code
  if (!country || typeof country !== 'string' || country.length !== 2) {
    return res.status(400).json({ error: 'Invalid country code provided. It must be a 2-letter code.' });
  }

  const userId = session.user.id;
  const adapter = authOptions.adapter;

  // Check if the adapter and required methods are available
  if (!adapter || !adapter.updateUser) {
    console.error('NextAuth adapter or the updateUser method is not configured correctly.');
    return res.status(500).json({ error: 'Server configuration error.' });
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
    return res.status(500).json({ error: 'An error occurred while saving your preference.' });
  }
}