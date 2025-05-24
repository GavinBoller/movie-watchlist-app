// pages/api/watchlist.js
   import { Pool } from 'pg';

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false },
   });

   export default async function handler(req, res) {
     if (req.method === 'POST') {
       const { id, title, overview, poster, release_date, media_type } = req.body;
       try {
         const result = await pool.query(
           'INSERT INTO movies (id, title, overview, poster, release_date, media_type) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING RETURNING *',
           [id, title, overview, poster, release_date, media_type]
         );
         res.status(200).json(result.rows[0] || { message: 'Item already in watchlist' });
       } catch (error) {
         console.error('Error adding to watchlist:', error.message);
         res.status(500).json({ error: 'Failed to add to watchlist' });
       }
     } else if (req.method === 'GET') {
       try {
         const result = await pool.query('SELECT * FROM movies ORDER BY title');
         res.status(200).json(result.rows);
       } catch (error) {
         console.error('Error fetching watchlist:', error.message);
         res.status(500).json({ error: 'Failed to fetch watchlist' });
       }
     } else if (req.method === 'DELETE') {
       const { id } = req.body;
       try {
         await pool.query('DELETE FROM movies WHERE id = $1', [id]);
         res.status(200).json({ message: 'Item removed' });
       } catch (error) {
         console.error('Error removing from watchlist:', error.message);
         res.status(500).json({ error: 'Failed to remove from watchlist' });
       }
     } else {
       res.status(405).json({ error: 'Method not allowed' });
     }
   }