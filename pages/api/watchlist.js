// watchlist.js
import { Pool } from '@neondatabase/serverless';
import NodeCache from 'node-cache';
import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth/[...nextauth]" // Adjust path if needed

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes TTL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  console.log(`${req.method} ${req.url} for user ${userId}`);

  try {
    if (req.method === 'GET') {      
      const { page = 1, limit = 50, search = '', media = 'all', status = 'all', sort_by = 'added_at_desc' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const cacheKey = `watchlist:${userId}:${page}:${limit}:${media}:${status}:${search}:${sort_by}`;
      const timerLabel = `Database query page ${page} ${Date.now()}`;

      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${cacheKey} in ${Date.now() - cached.start}ms`);
        return res.status(200).json(cached.data);
      }

      console.time(timerLabel);
      const start = Date.now();

      let sanitizedSearch = '';
      let words = [];
      if (search) {
        const cleanSearch = search
          .toLowerCase() // Case-insensitive
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .trim();
        if (cleanSearch) {
          // Always use prefix matching for all words for a better "starts with" feel.
          const words = cleanSearch.split(/\s+/).filter(word => word.length > 0);
          sanitizedSearch = words.map(word => `${word}:*`).join(' & ');
        }
      }

      let query = `
        SELECT id, movie_id, title, overview, poster, release_date, media_type,
               status, platform, notes, watched_date, imdb_id, vote_average, genres,
               runtime, seasons, episodes, added_at
        FROM watchlist
        WHERE user_id = $1
      `;
      const params = [userId];

      if (sanitizedSearch) {
        // Always use to_tsquery for consistency and to support prefix matching with ':*'
        query += ` AND title_tsv @@ to_tsquery('simple', $${params.length + 1})`;
        params.push(sanitizedSearch);
      }

      if (media !== 'all') {
        query += ` AND media_type = $${params.length + 1}`;
        params.push(media);
      }

      if (status !== 'all') {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      const sortOptions = {
        'added_at_desc': 'added_at DESC',
        'release_date_desc': 'release_date DESC NULLS LAST',
        'release_date_asc': 'release_date ASC NULLS LAST',
        'title_asc': 'title ASC',
        'title_desc': 'title DESC',
        'vote_average_desc': 'vote_average DESC NULLS LAST',
      };
      const orderByClause = sortOptions[sort_by] || sortOptions['added_at_desc'];

      query += `
        ORDER BY ${orderByClause}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      params.push(parseInt(limit), offset);

      const client = await pool.connect();
      try {
        const explainQuery = `EXPLAIN ANALYZE ${query}`;
        const explainResult = await client.query(explainQuery, params);
        console.log('Query plan:', explainResult.rows.map(row => row['QUERY PLAN']).join('\n'));

        const { rows } = await client.query(query, params);

        let countQuery = `
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE media_type = 'movie') AS movie,
            COUNT(*) FILTER (WHERE media_type = 'tv') AS tv,
            COUNT(*) FILTER (WHERE status = 'to_watch') AS to_watch,
            COUNT(*) FILTER (WHERE status = 'watching') AS watching,
            COUNT(*) FILTER (WHERE status = 'watched') AS watched
          FROM watchlist
          WHERE user_id = $1
        `;
        const countParams = [userId];
        let paramIndex = 2;

        if (sanitizedSearch) {
          countQuery += ` AND title_tsv @@ ${words.length === 1 ? 'plainto_tsquery' : 'to_tsquery'}($${paramIndex})`;
          countParams.push(sanitizedSearch);
          paramIndex++;
        }
        if (media !== 'all') {
          countQuery += ` AND media_type = $${paramIndex}`;
          countParams.push(media);
          paramIndex++;
        }
        if (status !== 'all') {
          countQuery += ` AND status = $${paramIndex}`;
          countParams.push(status);
          paramIndex++;
        }

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
        movie_id, 
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
        genres,
        runtime,
      } = req.body;

      if (!movie_id || typeof movie_id !== 'string' && typeof movie_id !== 'number') {
        return res.status(400).json({ error: 'Valid movie_id (string or number) is required.' });
      }
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title (non-empty string) is required.' });
      }
      if (media_type && !['movie', 'tv'].includes(media_type)) {
        return res.status(400).json({ error: "Invalid media_type. Must be 'movie' or 'tv'." });
      }
      if (status && !['to_watch', 'watching', 'watched'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'to_watch', 'watching', or 'watched'." });
      }
      if (vote_average !== undefined && vote_average !== null && (typeof vote_average !== 'number' || vote_average < 0 || vote_average > 10)) {
        return res.status(400).json({ error: 'Invalid vote_average. Must be a number between 0 and 10.' });
      }
      if (runtime !== undefined && runtime !== null && (typeof runtime !== 'number' || runtime < 0)) {
        return res.status(400).json({ error: 'Invalid runtime. Must be a non-negative number.' });
      }
      console.log(`Adding item ${movie_id} to watchlist`);

      const client = await pool.connect();
      try {
        const exists = await client.query(
          `SELECT 1 FROM watchlist WHERE user_id = $1 AND movie_id = $2`,
          [userId, movie_id.toString()]
        );
        if (exists.rows.length > 0) {
          return res.status(400).json({ error: 'Item already in watchlist' });
        }

        await client.query(
          `
          INSERT INTO watchlist (
            user_id, movie_id, title, overview, poster, release_date, media_type, genres, runtime,
            status, platform, notes, imdb_id, vote_average, seasons, episodes, added_at 
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
          )
        `,
          [
            userId,
            movie_id.toString(),
            title,
            overview || null,
            poster || null,
            release_date || null,
            media_type || 'movie',
            genres || null, 
            runtime || null, 
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
        const newItemQuery = await client.query('SELECT * FROM watchlist WHERE user_id = $1 AND movie_id = $2 ORDER BY added_at DESC LIMIT 1', [userId, movie_id.toString()]);
        return res.status(201).json({ message: 'Added to watchlist', item: newItemQuery.rows[0] });
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to add to watchlist' });
      } finally {
        client.release();
      }
    }

    if (req.method === 'PUT') {
      const {
        id,
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
        genres,
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Watchlist item ID is required for updating.' });
      }
      if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        return res.status(400).json({ error: 'Title, if provided, must be a non-empty string.' });
      }
      if (media_type && !['movie', 'tv'].includes(media_type)) {
        return res.status(400).json({ error: "Invalid media_type. Must be 'movie' or 'tv'." });
      }
      if (status && !['to_watch', 'watching', 'watched'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'to_watch', 'watching', or 'watched'." });
      }
      if (vote_average !== undefined && vote_average !== null && (typeof vote_average !== 'number' || vote_average < 0 || vote_average > 10)) {
        return res.status(400).json({ error: 'Invalid vote_average. Must be a number between 0 and 10.' });
      }
      if (runtime !== undefined && runtime !== null && (typeof runtime !== 'number' || runtime < 0)) {
        return res.status(400).json({ error: 'Invalid runtime. Must be a non-negative number.' });
      }

      const client = await pool.connect();
      try {
        const result = await client.query(
          `
          UPDATE watchlist
          SET
            title = $1, 
            movie_id = $2,
            overview = $3,
            poster = $4,
            release_date = $5,
            media_type = $6,
            status = $7,
            platform = $8,
            notes = $9,
            watched_date = $10,
            imdb_id = $11,
            vote_average = $12, 
            runtime = $13,        
            seasons = $14, 
            episodes = $15,
            genres = $16          
          WHERE id = $17 AND user_id = $18 
          RETURNING *
        `,
          [
            title,
            movie_id ? movie_id.toString() : null,
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
            genres || null,
            id,
            userId,
          ]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }
        cache.flushAll();
        return res.status(200).json({ message: 'Updated watchlist', item: result.rows[0] });
      } catch (error) {
        console.error('Error updating watchlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to update watchlist' });
      } finally {
        client.release();
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Watchlist item ID is required for deletion.' });
      }

      const client = await pool.connect();
      try {
        const result = await client.query(
          `DELETE FROM watchlist WHERE id = $1 AND user_id = $2 RETURNING id`,
          [id, userId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }
        cache.flushAll();
        return res.status(200).json({ message: 'success' });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal server error' });
      } finally {
        client.release();
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end();
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
