import { Pool } from '@neondatabase/serverless';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increase max connections
  idleTimeoutMillis: 30000, // 30s idle timeout
  connectionTimeoutMillis: 10000, // 10s connection timeout
});

export default async function handler(req, res) {
  const userId = 1; // Hardcoded for simplicity
  console.log(`${req.method} ${req.url}`);

  try {
    if (req.method === 'GET') {
      const { page = 1, limit = 50, search = '', media = 'all', status = 'all' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const cacheKey = `watchlist:${userId}:${page}:${limit}:${media}:${status}:${search}`;
      const timerLabel = `Database query page ${page} ${Date.now()}`; // Unique label

      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${cacheKey} in ${Date.now() - cached.start}ms`);
        return res.status(200).json(cached.data);
      }

      console.time(timerLabel);
      const start = Date.now();

      let query = `
        SELECT id, movie_id, title, overview, poster, release_date, media_type,
               status, platform, notes, watched_date, imdb_id, vote_average,
               runtime, seasons, episodes, added_at
        FROM watchlist
        WHERE user_id = $1
      `;
      const params = [userId];

      if (search) {
        query += ` AND title_tsv @@ to_tsquery($2)`;
        params.push(search.replace(/\s+/g, ' & '));
      }

      if (media !== 'all') {
        query += ` AND media_type = $${params.length + 1}`;
        params.push(media);
      }

      if (status !== 'all') {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      query += `
        ORDER BY added_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      params.push(parseInt(limit), offset);

      const client = await pool.connect();
      try {
        const explainQuery = `EXPLAIN ANALYZE ${query}`;
        const explainResult = await client.query(explainQuery, params);
        console.log('Query plan:', explainResult.rows.map(row => row['QUERY PLAN']).join('\n'));

        const { rows } = await client.query(query, params);

        const countQuery = `
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE media_type = 'movie') AS movie,
            COUNT(*) FILTER (WHERE media_type = 'tv') AS tv,
            COUNT(*) FILTER (WHERE status = 'to_watch') AS to_watch,
            COUNT(*) FILTER (WHERE status = 'watching') AS watching,
            COUNT(*) FILTER (WHERE status = 'watched') AS watched
          FROM watchlist
          WHERE user_id = $1
          ${search ? `AND title_tsv @@ to_tsquery($2)` : ''}
          ${media !== 'all' ? `AND media_type = $${search ? 3 : 2}` : ''}
          ${status !== 'all' ? `AND status = $${search ? (media !== 'all' ? 4 : 3) : (media !== 'all' ? 3 : 2)}` : ''}
        `;
        const countParams = [userId];
        if (search) countParams.push(search.replace(/\s+/g, ' & '));
        if (media !== 'all') countParams.push(media);
        if (status !== 'all') countParams.push(status);

        const { rows: [{ total, movie, tv, to_watch, watching, watched }] } = await client.query(countQuery, countParams);

        console.timeEnd(timerLabel);
        console.log(`Database query returned ${rows.length} items in ${Date.now() - start}ms`);

        const data = {
          items: rows,
          total: parseInt(total),
          filterCounts: {
            media: { all: parseInt(total), movie: parseInt(movie), tv: parseInt(tv) },
            status: { all: parseInt(total), to_watch: parseInt(to_watch), watching: parseInt(watching), watched: parseInt(watched) },
          },
        };

        cache.set(cacheKey, { data, start: Date.now() });
        return res.status(200).json(data);
      } finally {
        client.release();
      }
    }

    if (req.method === 'POST') {
      const {
        id,
        title,
        overview,
        poster,
        release_date,
        media_type,
        status,
        platform,
        notes,
        imdb_id,
        vote_average,
        seasons,
        episodes,
      } = req.body;

      console.log(`Adding item ${id} to watchlist`);

      const client = await pool.connect();
      try {
        const exists = await client.query(
          `SELECT 1 FROM watchlist WHERE user_id = $1 AND movie_id = $2`,
          [userId, id.toString()]
        );
        if (exists.rows.length > 0) {
          return res.status(400).json({ error: 'Item already in watchlist' });
        }

        await client.query(
          `
          INSERT INTO watchlist (
            user_id, movie_id, title, overview, poster, release_date, media_type,
            status, platform, notes, imdb_id, vote_average, seasons, episodes, added_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
          )
        `,
          [
            userId,
            id.toString(),
            title,
            overview || null,
            poster || null,
            release_date || null,
            media_type || 'movie',
            status || 'to_watch',
            platform || null,
            notes || null,
            imdb_id || null,
            vote_average ? parseFloat(vote_average) : null,
            seasons || null,
            episodes || null,
          ]
        );
        cache.flushAll();
        return res.status(200).json({ message: 'Added to watchlist' });
      } finally {
        client.release();
      }
    }

    if (req.method === 'PUT') {
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
        runtime,
        seasons,
        episodes,
      } = req.body;

      const client = await pool.connect();
      try {
        const result = await client.query(
          `
          UPDATE watchlist
          SET
            title = $1,
            overview = $2,
            poster = $3,
            release_date = $4,
            media_type = $5,
            status = $6,
            platform = $7,
            notes = $8,
            watched_date = $9,
            imdb_id = $10,
            vote_average = $11,
            runtime = $12,
            seasons = $13,
            episodes = $14
          WHERE id = $15 AND user_id = $16
          RETURNING *
        `,
          [
            title,
            overview || null,
            poster || null,
            release_date || null,
            media_type || 'movie',
            status || 'to_watch',
            platform || null,
            notes || null,
            watched_date || null,
            imdb_id || null,
            vote_average ? parseFloat(vote_average) : null,
            runtime || null,
            seasons || null,
            episodes || null,
            id,
            user_id,
          ]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }
        cache.flushAll();
        return res.status(200).json({ message: 'Updated watchlist' });
      } catch (error) {
        console.error('Error updating watchlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to update watchlist' });
      } finally {
        client.release();
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;

      const client = await pool.connect();
      try {
        const result = await client.query(
          `DELETE FROM watchlist WHERE id = $1 AND user_id = $2 RETURNING *`,
          [id, userId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }
        cache.flushAll();
        return res.status(200).json({ message: 'Deleted from watchlist' });
      } finally {
        client.release();
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}