import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const userId = 1; // Temporary; replace with auth logic

  try {
    if (req.method === 'GET') {
      const watchlist = await sql`
        SELECT id, movie_id, title, overview, poster, release_date, media_type, 
               status, platform, notes, watched_date, added_at, imdb_id
        FROM watchlist
        WHERE user_id = ${userId}
        ORDER BY added_at DESC
      `;
      const enhancedItems = await Promise.all(
        watchlist.map(async (item) => {
          try {
            const tmdbRes = await fetch(
              `https://api.themoviedb.org/3/${item.media_type}/${item.movie_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
            );
            const tmdbData = await tmdbRes.json();
            const externalRes = await fetch(
              `https://api.themoviedb.org/3/${item.media_type}/${item.movie_id}/external_ids?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
            );
            const externalData = await externalRes.json();
            return {
              ...item,
              title: tmdbData.title || tmdbData.name || item.title,
              overview: tmdbData.overview || item.overview,
              poster: tmdbData.poster_path || item.poster,
              release_date: tmdbData.release_date || tmdbData.first_air_date || item.release_date,
              imdb_id: externalData.imdb_id || item.imdb_id,
            };
          } catch (error) {
            console.error(`Error enhancing item ${item.movie_id}:`, error);
            return item;
          }
        })
      );
      res.status(200).json(enhancedItems);
    } else if (req.method === 'POST') {
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
      } = req.body;
      if (!id || !title) {
        return res.status(400).json({ error: 'id and title are required' });
      }
      const [newItem] = await sql`
        INSERT INTO watchlist (
          movie_id, user_id, title, overview, poster, release_date, media_type,
          status, platform, notes, watched_date, imdb_id
        )
        VALUES (
          ${String(id)}, ${userId}, ${title}, ${overview || null}, ${poster || null},
          ${release_date || null}, ${media_type || 'movie'}, ${status || 'to_watch'},
          ${platform || null}, ${notes || null}, ${watched_date || null}, ${imdb_id || null}
        )
        RETURNING *
      `;
      res.status(201).json(newItem);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}