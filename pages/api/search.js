import { fetcher } from '../../utils/fetcher';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

export default async function handler(req, res) {
  const { query, media_type = 'all', genre = 'all', sort_by = 'popularity.desc' } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const cacheKey = `tmdb_search:${query}:${media_type}:${genre}:${sort_by}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`TMDB Search Cache hit for ${cacheKey}`);
      return res.status(200).json({ data: cached });
    }

    let allResults = [];
    for (let page = 1; page <= 2; page++) { // Fetch first two pages for broader results
      const type = media_type === 'all' ? 'multi' : media_type;
      const url = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(query)}&page=${page}&sort_by=${sort_by}${
        genre !== 'all' ? `&with_genres=${genre}` : ''
      }`;
      const data = await fetcher(url); // fetcher now appends API key
      allResults = [...allResults, ...(data.results || [])];
    }

    // De-duplicate results in case an item appears on multiple pages, keeping the first instance
    const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());

    // Fetch details for each item to get imdb_id, runtime, genres etc.
    const enhancedResults = await Promise.all(
      uniqueResults.map(async (item) => {
        // If media_type is missing (e.g., from a specific movie/tv search), use the one from the request.
        const itemMediaType = item.media_type || (media_type !== 'all' ? media_type : null);

        if (itemMediaType !== 'movie' && itemMediaType !== 'tv') return null; // Filter out unsupported media types
        try {
          const detailsUrl = `https://api.themoviedb.org/3/${itemMediaType}/${item.id}?append_to_response=external_ids`;
          const details = await fetcher(detailsUrl); // fetcher now appends API key
          return {
            ...item,
            media_type: itemMediaType, // Ensure media_type is always present in the final object
            imdb_id: details.external_ids?.imdb_id || null,
            genres: details.genres?.map((g) => g.name).join(', ') || 'N/A',
            runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]) || null,
            // Add other details you need from the details endpoint (e.g., vote_average, seasons, episodes)
            vote_average: details.vote_average ? parseFloat(details.vote_average) : null,
            number_of_seasons: details.number_of_seasons || null,
            number_of_episodes: details.number_of_episodes || null,
          };
        } catch (error) {
          console.warn(`Failed to fetch details for ${item.id}:`, error);
          return item; // Return original item if details fetch fails
        }
      })
    );

    const finalResults = enhancedResults.filter(Boolean); // Remove nulls
    cache.set(cacheKey, finalResults);
    res.status(200).json({ data: finalResults });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
}