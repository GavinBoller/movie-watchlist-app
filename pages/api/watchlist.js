// watchlist.js
import { Pool, types } from '@neondatabase/serverless';
import NodeCache from 'node-cache';
import { getToken } from "next-auth/jwt";
import { authOptions } from "./auth/[...nextauth]" // Adjust path if needed
import { sanitizeInput, validateInput } from '../../lib/security';

// Prevent node-postgres from parsing DATE columns into JS Date objects.
// This returns them as "YYYY-MM-DD" strings, avoiding timezone issues.
types.setTypeParser(types.builtins.DATE, (val) => val);

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes TTL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const invalidateUserCache = (userId) => {
  const keys = cache.keys();
  const userKeys = keys.filter(key => key.startsWith(`watchlist:${userId}:`));
  if (userKeys.length > 0) {
    cache.del(userKeys);
    console.log(`Invalidated ${userKeys.length} cache entries for user ${userId}`);
  }
};

export default async function handler(req, res) {
  // Debug: Log cookies and headers
  console.log('Cookies:', req.cookies);
  console.log('Authorization header:', req.headers['authorization']);
  console.log('All headers:', req.headers);

  // Use getToken to extract JWT from cookies or Authorization header
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log('Decoded JWT token:', token);

  if (!token || !token.sub) {
    console.error('401 Unauthorized: No valid JWT token found');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = token.sub;

  try {
    if (req.method === 'GET') {      
      // Validate and sanitize query parameters
      const { 
        page = '1', 
        limit = '50', 
        search = '', 
        media = 'all', 
        status = 'all', 
        sort_by = 'added_at_desc' 
      } = req.query;

      // Validate parameters
      const validation = validateInput(
        { page, limit, media, status, sort_by },
        {
          page: { type: 'string', pattern: '^[0-9]+$', required: true },
          limit: { type: 'string', pattern: '^[0-9]+$', required: true },
          media: { type: 'string', enum: ['all', 'movie', 'tv'], required: true },
          status: { type: 'string', enum: ['all', 'to_watch', 'watching', 'watched'], required: true },
          sort_by: { 
            type: 'string', 
            enum: ['added_at_desc', 'release_date_desc', 'release_date_asc', 'title_asc', 'title_desc', 'vote_average_desc'], 
            required: true 
          }
        }
      );

      if (!validation.isValid) {
        return res.status(400).json({ error: 'Invalid query parameters', details: validation.errors });
      }

      // Safely parse to integers
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      // Prevent abuse with excessive limit values
      const safeLimit = Math.min(limitNum, 100); // Cap at 100 items per page
      const offset = (pageNum - 1) * safeLimit;
      
      // Sanitize search input to prevent SQL injection and XSS
      const sanitizedSearch = sanitizeInput(search);
      
      const cacheKey = `watchlist:${userId}:${pageNum}:${safeLimit}:${media}:${status}:${sanitizedSearch}:${sort_by}`;
      const timerLabel = `Database query page ${pageNum} ${Date.now()}`;
      
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        console.log(`Cache hit for ${cacheKey} in ${Date.now() - cachedResult.start}ms`);
        return res.status(200).json(cachedResult.data);
      }

      console.time(timerLabel);
      const start = Date.now();

      const client = await pool.connect();
      try {
        let whereClauses = ['user_id = $1'];
        let queryParams = [userId];
        let paramIndex = 2; // Start parameter index for dynamic clauses

        // --- Search Filter with SQL Injection Prevention ---
        if (sanitizedSearch.trim()) {
            const searchTerm = sanitizedSearch.trim();
            
            // Using placeholder parameters to prevent SQL injection
            whereClauses.push(`(title_tsv @@ to_tsquery('english', $${paramIndex++}) OR title ILIKE $${paramIndex++})`);
            
            // Prepare parameters for both search methods
            // Use a more secure approach for to_tsquery input
            const tsQueryParam = searchTerm.split(' ')
                .filter(w => w && w.length > 0)
                .map(w => w.replace(/[^\w\s]/g, '') + ':*') // Remove special chars and add prefix search
                .join(' & ');
            
            queryParams.push(tsQueryParam); // For to_tsquery
            queryParams.push(`%${searchTerm}%`); // For ILIKE
        }

        if (media !== 'all') {
          queryParams.push(media);
          whereClauses.push(`media_type = $${paramIndex++}`);
        }

        if (status !== 'all') {
          queryParams.push(status);
          whereClauses.push(`status = $${paramIndex++}`);
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

        const finalQuery = `
          WITH filtered_items AS (
            SELECT * FROM watchlist WHERE ${whereClauses.join(' AND ')}
          ),
          counts AS (
            SELECT
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE media_type = 'movie') AS movie,
              COUNT(*) FILTER (WHERE media_type = 'tv') AS tv,
              COUNT(*) FILTER (WHERE status = 'to_watch') AS to_watch,
              COUNT(*) FILTER (WHERE status = 'watching') AS watching,
              COUNT(*) FILTER (WHERE status = 'watched') AS watched
            FROM filtered_items
          )
          SELECT f.*, c.total, c.movie, c.tv, c.to_watch, c.watching, c.watched
          FROM filtered_items f
          CROSS JOIN counts c
          ORDER BY ${orderByClause}
          LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        
        const finalParams = [...queryParams, parseInt(limit), offset];
        const { rows } = await client.query(finalQuery, finalParams);

        const firstRow = rows[0] || {};
        const items = rows.map(({ total, movie, tv, to_watch, watching, watched, ...item }) => ({
          ...item,
          seasonNumber: item.seasonNumber ?? item.seasonnumber ?? null,
        }));

        console.timeEnd(timerLabel);
        console.log(`Database query returned ${items.length} items in ${Date.now() - start}ms`);

        const data = {
          items: items,
          total: parseInt(firstRow.total || 0),
          filterCounts: {
            media: { all: parseInt(firstRow.total || 0), movie: parseInt(firstRow.movie || 0), tv: parseInt(firstRow.tv || 0) },
            status: { all: parseInt(firstRow.total || 0), to_watch: parseInt(firstRow.to_watch || 0), watching: parseInt(firstRow.watching || 0), watched: parseInt(firstRow.watched || 0) },
          },
        };

        cache.set(cacheKey, { data, start: Date.now() });
        return res.status(200).json(data);
      } finally {
        client.release();
      }
    }

    if (req.method === 'POST') {
      // Sanitize all inputs to prevent XSS
      const sanitizedBody = sanitizeInput(req.body);
      
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
        watched_date,
      } = sanitizedBody;

      // Enhanced validation with detailed schema
      const validation = validateInput(
        sanitizedBody,
        {
          movie_id: { required: true }, // Accept string or number
          title: { type: 'string', required: true, minLength: 1, maxLength: 500 },
          media_type: { type: 'string', enum: ['movie', 'tv'] },
          status: { type: 'string', enum: ['to_watch', 'watching', 'watched'] },
          vote_average: { type: 'number', min: 0, max: 10 },
          runtime: { type: 'number', min: 0 },
          // Optional fields don't need detailed validation
        }
      );

      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid input data', 
          details: validation.errors 
        });
      }

      // Validate movie_id format
      if (typeof movie_id !== 'string' && typeof movie_id !== 'number') {
        return res.status(400).json({ error: 'Valid movie_id (string or number) is required.' });
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

        const { rows } = await client.query(
          `
          INSERT INTO watchlist (
            user_id, movie_id, title, overview, poster, release_date, media_type, genres, runtime, status,
            platform, notes, watched_date, imdb_id, vote_average, seasons, episodes, seasonNumber, added_at 
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
          ) RETURNING *
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
            watched_date ? watched_date : null,
            imdb_id || null,
            vote_average ? parseFloat(vote_average) : null,
            seasons || null,
            episodes || null,
            req.body.seasonNumber || null,
          ]
        );
        invalidateUserCache(userId);
        return res.status(201).json({ message: 'Added to watchlist', item: rows[0] });
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to add to watchlist' });
      } finally {
        client.release();
      }
    }

    if (req.method === 'PUT') {
      // Sanitize all inputs to prevent XSS
      const sanitizedBody = sanitizeInput(req.body);
      
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
        watched_date,
        imdb_id,
        vote_average,
        runtime,
        seasons,
        episodes,
        genres,
      } = sanitizedBody;

      // Enhanced validation with detailed schema
      const validation = validateInput(
        sanitizedBody,
        {
          id: { required: true }, // Accept any non-null value for ID check
          title: { type: 'string', minLength: 1, maxLength: 500 },
          media_type: { type: 'string', enum: ['movie', 'tv'] },
          status: { type: 'string', enum: ['to_watch', 'watching', 'watched'] },
          vote_average: { type: 'number', min: 0, max: 10 },
          runtime: { type: 'number', min: 0 },
          // Optional fields don't need detailed validation
        }
      );

      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid input data', 
          details: validation.errors 
        });
      }

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
            episodes = $14,
            genres = $15,
            seasonNumber = $16
          WHERE id = $17 AND user_id = $18
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
            watched_date ? watched_date : null,
            imdb_id || null,
            vote_average ? parseFloat(vote_average) : null,
            runtime || null,
            seasons || null,
            episodes || null,
            genres || null,
            req.body.seasonNumber || null,
            id,
            userId,
          ]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }
        invalidateUserCache(userId);
        return res.status(200).json({ message: 'Updated watchlist', item: result.rows[0] });
      } catch (error) {
        console.error('Error updating watchlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to update watchlist' });
      } finally {
        client.release();
      }
    }

    if (req.method === 'DELETE') {
      // Sanitize all inputs to prevent XSS
      const sanitizedBody = sanitizeInput(req.body);
      const { id } = sanitizedBody;

      // Validate the ID
      const validation = validateInput(
        { id },
        {
          id: { required: true }
        }
      );

      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid input data', 
          details: validation.errors 
        });
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
        invalidateUserCache(userId);
        return res.status(200).json({ message: 'success' });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal server error' });
      } finally {
        client.release();
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed', message: `The ${req.method} method is not supported for this endpoint.` });
  } catch (error) {
    console.error('Error:', error);
    // Don't expose detailed error messages to clients in production
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = isProduction ? 'Internal server error' : error.message || 'Internal server error';
    
    // Set appropriate HTTP status code based on error type
    let statusCode = 500;
    if (error.code === '23505') {
      // PostgreSQL unique violation
      statusCode = 409; // Conflict
    } else if (error.code === '22P02') {
      // Invalid text representation (e.g., invalid UUID)
      statusCode = 400; // Bad Request
    } else if (error.code === '23503') {
      // Foreign key violation
      statusCode = 400; // Bad Request
    }
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      code: isProduction ? undefined : error.code
    });
  }
}
