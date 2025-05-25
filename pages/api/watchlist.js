/* pages/api/watchlist.js */
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      console.log('Handling GET request');
      const result = await pool.query('SELECT * FROM movies');
      console.log('Fetch result:', result.rows);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
      console.log('Handling POST request:', JSON.stringify(req.body, null, 2));
      const { id, title, overview, poster, release_date, media_type } = req.body;

      if (!id || !title || !media_type) {
        console.error('Missing required fields:', { id, title, media_type });
        return res.status(400).json({ error: 'Missing required fields: id, title, media_type' });
      }

      const validMediaTypes = ['movie', 'tv'];
      if (!validMediaTypes.includes(media_type)) {
        console.error('Invalid media_type:', media_type);
        return res.status(400).json({ error: 'Invalid media_type' });
      }

      const query = 'INSERT INTO movies (id, title, overview, poster, release_date, media_type) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING RETURNING *';
      const values = [id, title, overview || null, poster || null, release_date || null, media_type];

      console.log('Executing query:', query);
      console.log('Query values:', values);
      const result = await pool.query(query, values);
      console.log('Insert result:', result.rows);
      return res.status(200).json(result.rows);
    } else if (req.method === 'DELETE') {
      console.log('Handling DELETE request:', JSON.stringify(req.body, null, 2));
      const { id } = req.body;
      if (!id) {
        console.error('Missing id');
        return res.status(400).json({ error: 'Missing id' });
      }

      const query = 'DELETE FROM movies WHERE id = $1';
      const values = [id];

      console.log('Executing query:', query);
      console.log('Query values:', values);
      const result = await pool.query(query, values);
      console.log('Delete result:', result.rowCount);
      return res.status(200).json({ deleted: result.rowCount });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error.message, error.stack);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
