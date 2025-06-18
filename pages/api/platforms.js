import { neon } from '@neondatabase/serverless';
import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth/[...nextauth]"

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const sql = neon(process.env.DATABASE_URL);
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const authenticatedUserId = session.user.id;

  try {
    if (req.method === 'GET') {
      // userId from query is no longer needed as we use authenticatedUserId
      // const { userId } = req.query;
      // if (!userId) {
      //   return res.status(400).json({ error: 'userId is required' });
      // }
      const platforms = await sql`
        SELECT id, name, logo_url, is_default
        FROM platforms
        WHERE user_id = ${authenticatedUserId}
        ORDER BY name ASC
      `;
      res.status(200).json(platforms);
    } else if (req.method === 'POST') {
      // userId from body is no longer needed
      const { name, logoUrl, isDefault } = req.body;
      // --- Start Input Validation ---
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Platform name (non-empty string) is required' });
      }
      if (logoUrl && typeof logoUrl !== 'string') {
        return res.status(400).json({ error: 'logoUrl, if provided, must be a string' });
      }
      if (isDefault !== undefined && typeof isDefault !== 'boolean') {
        return res.status(400).json({ error: 'isDefault, if provided, must be a boolean' });
      }
      // --- End Input Validation ---
      // Check for duplicate platform name
      const existing = await sql`
        SELECT id FROM platforms
        WHERE user_id = ${authenticatedUserId} AND LOWER(name) = LOWER(${name})
      `;
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Platform already exists' });
      }

      // Check for existing default platform
      if (isDefault) {
        const defaultExists = await sql`
          SELECT id FROM platforms
          WHERE user_id = ${authenticatedUserId} AND is_default = true
        `;
        if (defaultExists.length > 0) {
          return res.status(400).json({ error: 'A default platform already exists' });
        }
      }

      // If setting as default, unset others
      if (isDefault) {
        await sql`
          UPDATE platforms
          SET is_default = false
          WHERE user_id = ${authenticatedUserId}
        `;
      }

      const [platform] = await sql`
        INSERT INTO platforms (user_id, name, logo_url, is_default)
        VALUES (${authenticatedUserId}, ${name}, ${logoUrl || null}, ${isDefault || false})
        RETURNING id, name, logo_url, is_default
      `;
      res.status(201).json(platform);
    } else if (req.method === 'PUT') {
      // userId from body is no longer needed
      const { id, name, logoUrl, isDefault } = req.body;
      // --- Start Input Validation ---
      if (!id) {
        return res.status(400).json({ error: 'Platform ID is required' });
      }
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Platform name (non-empty string) is required' });
      }
      if (logoUrl && typeof logoUrl !== 'string') {
        return res.status(400).json({ error: 'logoUrl, if provided, must be a string' });
      }
      if (isDefault !== undefined && typeof isDefault !== 'boolean') {
        return res.status(400).json({ error: 'isDefault, if provided, must be a boolean' });
      }
      // --- End Input Validation ---
      // Check for duplicate platform name (excluding current platform)
      const existing = await sql`
        SELECT id FROM platforms
        WHERE user_id = ${authenticatedUserId} AND LOWER(name) = LOWER(${name}) AND id != ${id}
      `;
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Platform already exists' });
      }

      // Check for existing default platform (if setting as default)
      if (isDefault) {
        const defaultExists = await sql`
          SELECT id FROM platforms
          WHERE user_id = ${authenticatedUserId} AND is_default = true AND id != ${id}
        `;
        if (defaultExists.length > 0) {
          return res.status(400).json({ error: 'A default platform already exists' });
        }
      }

      // If setting as default, unset others
      if (isDefault) {
        await sql`
          UPDATE platforms
          SET is_default = false
          WHERE user_id = ${authenticatedUserId}
        `;
      }

      const [platform] = await sql`
        UPDATE platforms
        SET name = ${name}, logo_url = ${logoUrl || null}, is_default = ${isDefault || false}
        WHERE id = ${id} AND user_id = ${authenticatedUserId}
        RETURNING id, name, logo_url, is_default
      `;
      if (!platform) {
        return res.status(404).json({ error: 'Platform not found' });
      }
      res.status(200).json(platform);
    } else if (req.method === 'DELETE') {
      // Ensure delete is also scoped by user
      const { id } = req.body; // id of the platform to delete
      if (!id) {
        return res.status(400).json({ error: 'Platform ID is required for deletion' });
      }
      // --- Start Input Validation ---
      // ID presence is already checked above.
      // --- End Input Validation ---
      const [platform] = await sql`
        DELETE FROM platforms
        WHERE id = ${id} AND user_id = ${authenticatedUserId}
        RETURNING id, user_id
      `;
      if (!platform) {
        return res.status(404).json({ error: 'Platform not found' });
      }
      res.status(200).json({ message: 'Platform deleted' });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}