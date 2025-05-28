import { Pool } from 'pg';

const cache = new Map();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { method } = req;
  const userId = 1;
  const cacheKey = `watchlist:${userId}`;
  const startTime = Date.now();

  switch (method) {
    case 'GET':
      try {
        console.log('Fetching watchlist from database...');
        const result = await pool.query(
          'SELECT * FROM watchlist WHERE user_id = $1',
          [userId]
        );
        console.log(`Database query returned ${result.rows.length} items in ${Date.now() - startTime}ms`);
        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: 'Failed to fetch watchlist', details: error.message });
      }
      break;

    case 'POST':
      try {
        const { id, title, overview, poster, release_date, media_type, status, platform, notes, imdb_id, vote_average } = req.body;
        const movieId = id;

        console.log(`Adding item ${movieId} to watchlist`);
        const existing = await pool.query(
          'SELECT id FROM watchlist WHERE user_id = $1 AND movie_id = $2',
          [userId, movieId]
        );
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'Item already in watchlist' });
        }

        const result = await pool.query(
          `INSERT INTO watchlist (
            user_id, movie_id, title, overview, poster, release_date, media_type, status, platform, notes, imdb_id, vote_average
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [
            userId,
            movieId,
            title,
            overview,
            poster,
            release_date,
            media_type,
            status || 'to_watch',
            platform || null,
            notes || null,
            imdb_id || null,
            vote_average || null,
          ]
        );

        cache.delete(cacheKey);
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ error: 'Failed to add to watchlist', details: error.message });
      }
      break;

    case 'PUT':
      try {
        const {
          id,
          user_id,
          movie_id,
          title,
          overview,
          poster,
          release_date,
          media_type,
          status,
          platform,
          notes,
          watched_date,
          imdb_id,
          vote_average,
        } = req.body;

        const result = await pool.query(
          `UPDATE watchlist
           SET title = $1, overview = $2, poster = $3, release_date = $4, media_type = $5, status = $6,
               platform = $7, notes = $8, watched_date = $9, imdb_id = $10, vote_average = $11
           WHERE id = $12 AND user_id = $13
           RETURNING *`,
          [
            title,
            overview,
            poster,
            release_date,
            media_type,
            status,
            platform || null,
            notes || null,
            watched_date || null,
            imdb_id || null,
            vote_average || null,
            id,
            user_id,
          ]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }

        cache.delete(cacheKey);
        res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Error updating watchlist:', error);
        res.status(500).json({ error: 'Failed to update watchlist', details: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.body;
        const result = await pool.query(
          'DELETE FROM watchlist WHERE id = $1 AND user_id = $2 RETURNING *',
          [id, userId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }

        cache.delete(cacheKey);
        res.status(200).json({ message: 'Item deleted' });
      } catch (error) {
        console.error('Error deleting from watchlist:', error);
        res.status(500).json({ error: 'Failed to delete from watchlist', details: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${method} not allowed` });
  }
}