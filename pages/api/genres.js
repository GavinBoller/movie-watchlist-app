import { fetcher } from '../../utils/fetcher';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 }); // Cache genres for 24 hours

export default async function handler(req, res) {
  const cacheKey = 'tmdb_genres';
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log(`TMDB Genres Cache hit for ${cacheKey}`);
    return res.status(200).json(cached);
  }

  try {
    const movieGenresRes = await fetcher('https://api.themoviedb.org/3/genre/movie/list');
    const tvGenresRes = await fetcher('https://api.themoviedb.org/3/genre/tv/list');

    const allGenres = [
      ...(movieGenresRes.genres || []),
      ...(tvGenresRes.genres || []),
    ];

    // Deduplicate genres by ID
    const uniqueGenres = Array.from(new Map(allGenres.map(genre => [genre.id, genre])).values());

    // Sort alphabetically by name
    uniqueGenres.sort((a, b) => a.name.localeCompare(b.name));

    cache.set(cacheKey, uniqueGenres);
    res.status(200).json(uniqueGenres);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
}