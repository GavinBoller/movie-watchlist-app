import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const platforms = await sql`
        SELECT id, name, logo_url, is_default
        FROM platforms
        WHERE user_id = ${userId}
        ORDER BY name ASC
      `;
      res.status(200).json(platforms);
    } else if (req.method === 'POST') {
      const { userId, name, logoUrl, isDefault } = req.body;
      if (!userId || !name) {
        return res.status(400).json({ error: 'userId and name are required' });
      }

      // Check for duplicate platform name
      const existing = await sql`
        SELECT id FROM platforms
        WHERE user_id = ${userId} AND LOWER(name) = LOWER(${name})
      `;
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Platform already exists' });
      }

      // Check for existing default platform
      if (isDefault) {
        const defaultExists = await sql`
          SELECT id FROM platforms
          WHERE user_id = ${userId} AND is_default = true
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
          WHERE user_id = ${userId}
        `;
      }

      const [platform] = await sql`
        INSERT INTO platforms (user_id, name, logo_url, is_default)
        VALUES (${userId}, ${name}, ${logoUrl || null}, ${isDefault || false})
        RETURNING id, name, logo_url, is_default
      `;
      res.status(201).json(platform);
    } else if (req.method === 'PUT') {
      const { id, userId, name, logoUrl, isDefault } = req.body;
      if (!id || !userId || !name) {
        return res.status(400).json({ error: 'id, userId, and name are required' });
      }

      // Check for duplicate platform name (excluding current platform)
      const existing = await sql`
        SELECT id FROM platforms
        WHERE user_id = ${userId} AND LOWER(name) = LOWER(${name}) AND id != ${id}
      `;
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Platform already exists' });
      }

      // Check for existing default platform (if setting as default)
      if (isDefault) {
        const defaultExists = await sql`
          SELECT id FROM platforms
          WHERE user_id = ${userId} AND is_default = true AND id != ${id}
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
          WHERE user_id = ${userId}
        `;
      }

      const [platform] = await sql`
        UPDATE platforms
        SET name = ${name}, logo_url = ${logoUrl || null}, is_default = ${isDefault || false}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, name, logo_url, is_default
      `;
      if (!platform) {
        return res.status(404).json({ error: 'Platform not found' });
      }
      res.status(200).json(platform);
    } else if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }
      const [platform] = await sql`
        DELETE FROM platforms
        WHERE id = ${id}
        RETURNING id
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