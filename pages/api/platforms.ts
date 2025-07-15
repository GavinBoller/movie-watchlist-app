// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { secureApiHandler } from '../../lib/secureApiHandler';
import { platformCreateSchema, platformUpdateSchema, platformDeleteSchema } from '../../lib/schemas/platforms';

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const sql = neon(process.env.DATABASE_URL);
  // Debug logging for session
  console.log('[API/platforms] req.session:', req.session);
  console.log('[API/platforms] req.session.user:', req.session?.user);
  console.log('[API/platforms] req.session.user.id:', req.session?.user?.id);
  const authenticatedUserId = req.session.user.id;

  try {
    if (req.method === 'GET') {
      const platforms = await sql`
        SELECT id, name, logo_url, is_default
        FROM platforms
        WHERE user_id = ${authenticatedUserId}
        ORDER BY name ASC
      `;
      res.status(200).json(platforms);
    } else if (req.method === 'POST') {
      const { name, logoUrl, isDefault } = req.body;

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
      const { id, name, logoUrl, isDefault } = req.body;

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

      const [platform] = await sql`
        DELETE FROM platforms
        WHERE id = ${id} AND user_id = ${authenticatedUserId}
        RETURNING id, user_id
      `;
      if (!platform) {
        return res.status(404).json({ error: 'Platform not found' });
      }
      res.status(200).json({ message: 'Platform deleted' });
    }
  } catch (error) {
    console.error('API error:', error);
    throw error; // Let secureApiHandler handle this error
  }
}

export default secureApiHandler(handler, {
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  requireAuth: true,
  validationSchema: (req) => {
    switch (req.method) {
      case 'POST': return platformCreateSchema;
      case 'PUT': return platformUpdateSchema;
      case 'DELETE': return platformDeleteSchema;
      default: return null; // No validation for GET
    }
  }
});