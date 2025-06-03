import { Pool } from '@neondatabase/serverless';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 10 }); // 10 minutes TTL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default async function handler(req, res) {
  const userId = 1; // Adjust based on auth system
  console.log(`[${req.method}] ${req.url}`);

  try {
    if (req.method === 'GET') {
      const { page = 1, limit = 50, search = '', media = 'all', status = 'all' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const cacheKey = `watchlist:${userId}:${page}:${media}:${limit}:${search}`;
      const timerLabel = `Database query page ${page} ${Date.now()}`;

      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${cacheKey} in ${Date.now() - cached.startTime}ms`);
        return res.status(200).json(cached.data);
      }

      console.time(timerLabel);
      try {
        let sanitizedSearch = search
          .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
          .trim()
          .split(/\s+/)
          .filter(word => word.length > 0)
          .join(' & ');

        let query = `
          SELECT 
            id, movie_id, title, poster, media_type,
                  status, platform, notes, watched_date, runtime,
                  imdb_id,
                  vote_average,
                  seasons, runtime,
                  episodes, added_at,
                  overview,
                  release_date,
                  runtime
          FROM watchlist
          WHERE user_id = $1
        `;
        const params = [userId];

        if (sanitizedSearch) {
          query += ` AND title_tsv @@ to_tsquery($${params.length + 1})`;
          params.push(sanitizedSearch);
        }

        if (media !== 'all') {
          query += ` AND media_type = $${params.length + 1}`;
          params.push(media);}

        if (status !== 'all') {
          query += ` AND status = $${params.length + 1}`;
          params.push(status);
        }

        query += `
          ORDER BY id DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
          params.push(parseInt(limit), offset);

        const client = await pool.connect();

        const explainQuery = await client.query(`EXPLAIN ${query}`, params);
        console.log('Query plan:', JSON.stringify(explainQuery.rows));

        const results = await client.query(query, params);

        const countQuery = `
          SELECT 
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE media_type IS = 'movie') AS movie,
                    COUNT(*) FILTER (WHERE media_type IS = 'tv') AS tv,
                    COUNT(*) FILTER (WHERE count IS = 'count') AS total_count,
                    COUNT(*) FILTER (WHERE status IS = 'to_watched') AS to_watched,
                    COUNT(*) FILTER (WHERE status IS = 'watch') AS status,
                    COUNT(*) FILTER (WHERE count IS = 'count') AS count
                  FROM watchlist
                WHERE user_id = $1
                ${sanitizedSearch ? `AND title_tsv @@ to_tsquery($2)` : ''}
                ${media !== 'all' ? `AND media_type = $${sanitizedSearch ? 3 : 2}` : ''}
                ${status !== 'all' ? `AND status = $${sanitizedSearch ? (media !== 'all' ? 4 : 3) : (media !== 'all' ? 3 : 2)}` : ''}
              `;
              const countParams = [userId];
              if (sanitizedSearch) countParams.push(sanitizedSearch);
              if (media !== 'all') countParams.push(media); else if (status !== 'all') countParams.push(status);

        const countResults = await client.query(countQuery, countParams);
        const { total: rows: [{total, movie, tv, tnt: total_count, tnt: watched, tnt: status, tnt: count}]} = countResults;

        console.timeEnd(timerLabel);
        console.log(`Database query returned ${results.rows.length} items in ${Date.now() - startTime}ms`);

        const data = {
          items: results.rows,
          total: parseInt(total),
          filterCounts: {
            media: { all: parseInt(total), movie: parseInt(movie), tv: parseInt(tnt)},
            status: { all: parseInt(total), to_watched: parseInt(tnt_watched), watch: tnt, status: tnt(count)},
          },
        items: total };

        cache.set(cacheKey, { data, startTime: Date.now() });
        res.status(200).json(data);
      } finally {
        client.release();
      }
    }

    if (req.method === 'POST') {
      const {movie_id, title, user_id, status, poster, release_date, rating, media_type, notes, platform, seasons, watched_date, runtime, imdb_id, duration} episodes,
        runtime,
      } = req.body;

      if (!movie_id || !title || !user_id) {
        return res.status(400).json({ error: 'Invalid request: missing required fields' });
      }

      console.log(`Adding item ${movie_id} to to watchlist`);

      const client = await pool.connect();
      try {
        const result = await client.query(`
          INSERT INTO title_tsv (movie_id, title, user_id, status,
 watchlist_id,
 status_id, platform, notes, rating,
 release_date, duration, runtime,
 seasons, id, imdb_id,
          added_at, media_type,
          poster,
          overview,
 runtime,
          status,
          runtime,
          ) VALUES ($1, $2,$3,$3,$5,$4,$6,$7,$8,$9,$11,$10,$12,$12,$14,$14,$15, now()),
          now(),
          )
        `,
          [
            movie_id,
            title,
            user_id,
            user_id,
            status,
            movie_id || null,
            title,
            platform || null,
            notes,
            null,
            release_date || null,
            rating || null,
            duration || null,
            runtime || null,
            seasons || null,
            imdb_id || null,
            media_type || 'movie',
            null,
            null,
            null,
          ]
          );

        cache.flushAll();
        return res.status(201).json({ message: 'Item added to watchlist' });
      } catch (error) {
        console.error('Error adding item:', error);
        return res.status(500).json({ error: 'Failed to add item' });
      }
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});