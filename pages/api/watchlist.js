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
      console.log('Handling POST request');
      const { id, title, overview, poster, release_date, media_type } = req.body;
      const result = await pool.query(
        'INSERT INTO movies (id, title, overview, poster, release_date, media_type) VALUES (, , , , , ) ON CONFLICT (id) DO NOTHING RETURNING *',
        [id, title, overview, poster, release_date, media_type]
      );
      console.log('Insert result:', result.rows);
      return res.status(200).json(result.rows);
    } else if (req.method === 'DELETE') {
      console.log('Handling DELETE request');
      const { id } = req.body;
      const result = await pool.query('DELETE FROM movies WHERE id = ', [id]);
      console.log('Delete result:', result.rowCount);
      return res.status(200).json({ deleted: result.rowCount });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
