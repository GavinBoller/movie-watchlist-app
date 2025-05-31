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

  const { method, query, body } = req;
  const userId = 1;
  const page = parseInt(query.page) || 1;
  const limit = 50; // Hardcode limit to 50
  const mediaType = query.media || 'all';
  const status = query.status || 'all';
  const search = query.search || '';
  const cacheKey = `watchlist:${userId}:${page}:${limit}:${mediaType}:${status}:${search}`;
  const startTime = Date.now();

  switch (method) {
    case 'GET':
      try {
        const offset = (page - 1) * limit;

        if (cache.has(cacheKey)) {
          console.log(`Cache hit for ${cacheKey} in ${Date.now() - startTime}ms`);
          return res.status(200).json(cache.get(cacheKey));
        }

        console.log('Fetching watchlist from database...');
        let whereClause = 'WHERE user_id = $1';
        const params = [userId];
        let paramIndex = 2;

        if (mediaType !== 'all') {
          whereClause += ` AND media_type = $${paramIndex++}`;
          params.push(mediaType);
        }
        if (status !== 'all') {
          whereClause += ` AND status = $${paramIndex++}`;
          params.push(status);
        }
        if (search) {
          whereClause += ` AND title ILIKE $${paramIndex++}`;
          params.push(`%${search}%`);
        }

        const queryText = `
          SELECT id, movie_id, title, overview, poster, release_date, media_type, status, platform, notes, watched_date, added_at, imdb_id, vote_average, runtime, seasons, episodes
          FROM watchlist
          ${whereClause}
          ORDER BY added_at DESC
          LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        const totalCountQuery = `
          SELECT COUNT(*) AS total
          FROM watchlist
          ${whereClause}
        `;
        const filterCountQuery = `
          SELECT 
            COUNT(*) FILTER (WHERE media_type = 'movie') AS movie_count,
            COUNT(*) FILTER (WHERE media_type = 'tv') AS tv_count,
            COUNT(*) FILTER (WHERE status = 'to_watch') AS to_watch_count,
            COUNT(*) FILTER (WHERE status = 'watching') AS watching_count,
            COUNT(*) FILTER (WHERE status = 'watched') AS watched_count
          FROM watchlist
          ${whereClause}
        `;

        console.time(`Database query page ${page}`);
        const [result, totalCountResult, filterCountResult] = await Promise.all([
          pool.query(queryText, [...params, limit, offset]),
          pool.query(totalCountQuery, params),
          pool.query(filterCountQuery, params),
        ]);
        console.timeEnd(`Database query page ${page}`);

        const response = {
          items: result.rows,
          total: parseInt(totalCountResult.rows[0].total),
          pages: Math.ceil(parseInt(totalCountResult.rows[0].total) / limit),
          page,
          filterCounts: {
            media: {
              all: parseInt(totalCountResult.rows[0].total),
              movie: parseInt(filterCountResult.rows[0].movie_count),
              tv: parseInt(filterCountResult.rows[0].tv_count),
            },
            status: {
              all: parseInt(totalCountResult.rows[0].total),
              to_watch: parseInt(filterCountResult.rows[0].to_watch_count),
              watching: parseInt(filterCountResult.rows[0].watching_count),
              watched: parseInt(filterCountResult.rows[0].watched_count),
            },
          },
        };
        console.log(`Database query returned ${result.rows.length} items in ${Date.now() - startTime}ms`);

        cache.set(cacheKey, response);
        res.status(200).json(response);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({
          error: 'Failed to fetch watchlist',
          details: error.message,
          items: [],
          total: 0,
          pages: 0,
          filterCounts: { media: {}, status: {} },
        });
      }
      break;

    case 'POST':
      try {
        const { id, title, overview, poster, release_date, media_type, status, platform, notes, imdb_id, vote_average, seasons, episodes } = body;
        const movieId = id.toString().split('-')[0];

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
            user_id, movie_id, title, overview, poster, release_date, media_type, status, platform, notes, imdb_id, vote_average, seasons, episodes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
            vote_average ? parseFloat(vote_average) : null,
            seasons || null,
            episodes || null,
          ]
        );

        cache.clear();
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
          seasons,
          episodes,
        } = body;

        const result = await pool.query(
          `UPDATE watchlist
           SET movie_id = $1, title = $2, overview = $3, poster = $4, release_date = $5, media_type = $6,
               status = $7, platform = $8, notes = $9, watched_date = $10, imdb_id = $11, vote_average = $12,
               seasons = $13, episodes = $14
           WHERE id = $15 AND user_id = $16
           RETURNING *`,
          [
            movie_id || null,
            title || null,
            overview,
            poster || null,
            release_date || null,
            media_type || 'movie',
            status || 'to_watch',
            platform || null,
            notes || null,
            watched_date || null,
            imdb_id || null,
            vote_average ? parseFloat(vote_average) : null,
            seasons || null,
            episodes || null,
            id,
            user_id || 1,
          ]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }

        cache.clear();
        res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Error updating watchlist:', error);
        res.status(500).json({ error: 'Failed to update watchlist', details: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { id } = body;
        const result = await pool.query(
          'DELETE FROM watchlist WHERE id = $1 AND user_id = $2 RETURNING *',
          [id, userId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }

        cache.clear();
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