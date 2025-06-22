// search.js
import { fetcher } from '../../utils/fetcher';
import NodeCache from 'node-cache';

// Cache for raw, multi-page TMDB search results. Longer TTL since this data is less specific.
const rawSearchCache = new NodeCache({ stdTTL: 3600 * 6 }); // 6-hour TTL

// Cache for final, processed (filtered, sorted, enhanced) results. Shorter TTL.
const processedCache = new NodeCache({ stdTTL: 3600 }); // 1-hour TTL

export default async function handler(req, res) {
  const {
    query,
    media_type = 'all',
    genre_id = 'all',
    min_rating = '0',
    sort_by = 'popularity.desc'
  } = req.query;

  // Return early if there's no query and no filters are applied.
  if (!query && genre_id === 'all' && min_rating === '0') {
    return res.status(200).json({ data: [], counts: { all: 0, movie: 0, tv: 0 } });
  }

  const useDiscover = !query;

  // First, check for a cached version of the fully processed request.
  const processedCacheKey = `tmdb:processed:${query}:${media_type}:${genre_id}:${min_rating}:${sort_by}`;
  const cachedProcessed = processedCache.get(processedCacheKey);
  if (cachedProcessed) {
    console.log(`Processed Cache hit for ${processedCacheKey}`);
    return res.status(200).json(cachedProcessed); // Return the full cached object
  }

  try {
    let initialResults = [];

    if (useDiscover) {
      // --- DISCOVER LOGIC (for filter-based browsing without a text query) ---
      const fetchDiscoverPage = async (type, page) => {
        let url = `https://api.themoviedb.org/3/discover/${type}?page=${page}&sort_by=${sort_by}`;
        if (genre_id !== 'all') url += `&with_genres=${genre_id}`;
        if (min_rating !== '0') url += `&vote_average.gte=${min_rating}`;
        const data = await fetcher(url);
        // Add media_type since discover endpoint doesn't provide it
        return (data.results || []).map(item => ({ ...item, media_type: type }));
      };

      const pagesToFetch = media_type === 'all' ? 5 : 10; // Fetch more pages for discover
      const pagePromises = [];
      for (let i = 1; i <= pagesToFetch; i++) {
        if (media_type === 'all') {
          pagePromises.push(fetchDiscoverPage('movie', i));
          pagePromises.push(fetchDiscoverPage('tv', i));
        } else {
          pagePromises.push(fetchDiscoverPage(media_type, i));
        }
      }
      const pagesResults = await Promise.all(pagePromises);
      initialResults = pagesResults.flat();

    } else {
      // --- SEARCH LOGIC (for text-based queries with server-side filtering) ---
      const rawCacheKey = `tmdb:raw-search:${query}`;
      let rawResults = rawSearchCache.get(rawCacheKey);

      if (rawResults) {
        console.log(`Raw Search Cache hit for ${rawCacheKey}`);
      } else {
        console.log(`Raw Search Cache miss for ${rawCacheKey}`);
        const fetchSearchPage = async (page) => {
          const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&page=${page}`;
          const data = await fetcher(url);
          return data.results || [];
        };
        
        const pagesToFetch = 5;
        const pagePromises = [];
        for (let i = 1; i <= pagesToFetch; i++) {
          pagePromises.push(fetchSearchPage(i));
        }
        const pagesResults = await Promise.all(pagePromises);
        rawResults = pagesResults.flat().filter(item => item.media_type === 'movie' || item.media_type === 'tv');
        
        rawSearchCache.set(rawCacheKey, rawResults);
      }
      initialResults = rawResults;
    }

    // IMPORTANT: Standardize initialResults structure before filtering/enhancing.
    // This ensures all items have 'popularity' and 'release_date' handled consistently
    // (e.g., missing dates are null, popularity is a number) regardless of source (discover/search).
    initialResults = initialResults.map(item => ({
      ...item, // Keep all original properties like poster_path, overview, etc.
      title: item.title || item.name, // Standardize title
      release_date: item.release_date || item.first_air_date || null, // Standardize release date to null if missing
      popularity: item.popularity || 0, // Ensure popularity is always a number
    }));

    // --- Apply filters and relevance scoring ---
    // filteredResults now starts from the standardized initialResults
    let filteredResults = initialResults;

    if (media_type !== 'all') {
      filteredResults = filteredResults.filter(item => item.media_type === media_type);
    }
    if (genre_id !== 'all') {
      const numericGenreId = parseInt(genre_id, 10);
      filteredResults = filteredResults.filter(item => item.genre_ids && item.genre_ids.includes(numericGenreId));
    }
    if (min_rating !== '0') {
      const numericMinRating = parseFloat(min_rating);
      filteredResults = filteredResults.filter(item => item.vote_average && item.vote_average >= numericMinRating);
    }

    if (query) {
      const queryLower = query.toLowerCase();
      filteredResults.forEach(item => {
        const title = (item.title || item.name || '').toLowerCase();
        let score = 0;
        if (title === queryLower) score = 3;
        else if (title.startsWith(queryLower)) score = 2;
        else if (title.includes(queryLower)) score = 1;
        item.relevanceScore = score;
      });
      // Pre-sort by relevance to get the most important items to enhance
      filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    // Ensure relevanceScore is 0 if no query, so it doesn't interfere with discover sorting
    else {
      filteredResults.forEach(item => item.relevanceScore = 0);
    }

    // --- Enhance top results ---
    const uniqueResults = Array.from(new Map(filteredResults.map(item => [item.id, item])).values());
    const resultsToEnhance = uniqueResults.slice(0, 100); // Only enhance the top 100 unique results
    const enhancedResults = await Promise.all(
      resultsToEnhance.map(async (item) => {
        const itemMediaType = item.media_type;
        if (!itemMediaType) return null;
        try {
          const detailsUrl = `https://api.themoviedb.org/3/${itemMediaType}/${item.id}?append_to_response=external_ids`;
          const details = await fetcher(detailsUrl);
          return {
            ...item, // Keep all existing properties from the initial standardized item
            imdb_id: details.external_ids?.imdb_id || null,
            genres: details.genres?.map((g) => g.name).join(', ') || 'N/A',
            runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]) || null,
            // Ensure these are explicitly set from details, as they are crucial for sorting.
            // Fallback to item's value if details API doesn't provide it.
            release_date: details.release_date || item.release_date,
            vote_average: details.vote_average ? parseFloat(details.vote_average) : item.vote_average,
            number_of_seasons: details.number_of_seasons || null,
            number_of_episodes: details.number_of_episodes || null,
          };
        } catch (error) {
          console.warn(`Failed to fetch details for ${item.id}:`, error);
          return item; // Return original item if enhancement fails, so it's not lost
        }
      })
    ).then(results => results.filter(Boolean)); // Filter out any nulls if an item explicitly returned null

    // Helper function for robust date parsing
    const parseDate = (dateStr) => {
      if (!dateStr) return null; // Handle null, undefined, or empty string
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date; // Return null for invalid dates
    };

    // --- Final Sort on Enhanced Data ---
    enhancedResults.sort((a, b) => {
      const [sortField, sortOrder] = sort_by.split('.');

      // When a search query is present, "Popularity" sort should prioritize relevance.
      // This ensures "Dune" appears before a more popular but irrelevant item like "Bambi".
      if (query && sortField === 'popularity') {
        const scoreA = a.relevanceScore || 0;
        const scoreB = b.relevanceScore || 0;
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher relevance score comes first.
        }
        // If relevance is the same, fall through to sort by popularity as a tie-breaker.
      }

      // Helper to get a comparable value from an item, handling different data types
      const getComparable = (item, field) => {
        switch (field) {
          case 'release_date':
            // The parseDate helper is defined just above this sort block
            return parseDate(item.release_date);
          case 'title':
            return (item.title || item.name || '').toLowerCase();
          case 'vote_average':
          case 'popularity':
            return parseFloat(item[field]) || 0;
          default:
            return item[field]; // Fallback for any other fields
        }
      };

      const valA = getComparable(a, sortField);
      const valB = getComparable(b, sortField);

      // Handle null/undefined/invalid values by pushing them to the end
      const aExists = valA !== null && valA !== undefined && !(valA instanceof Date && isNaN(valA.getTime()));
      const bExists = valB !== null && valB !== undefined && !(valB instanceof Date && isNaN(valB.getTime()));

      if (!aExists) return 1;
      if (!bExists) return -1;

      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = valA.localeCompare(valB);
          break;
        case 'release_date':
          // valA and valB are valid Date objects here
          comparison = valA.getTime() - valB.getTime();
          break;
        case 'vote_average':
        case 'popularity':
          comparison = valA - valB;
          break;
        default:
          // If sort_by is an unknown field, fallback to popularity descending
          comparison = (getComparable(a, 'popularity')) - (getComparable(b, 'popularity'));
          return comparison * -1;
      }

      // If the primary sort results in a tie, use popularity (desc) as a tie-breaker
      if (comparison === 0 && sortField !== 'popularity') {
        return (getComparable(b, 'popularity')) - (getComparable(a, 'popularity'));
      }

      // Apply ascending/descending order to the final comparison value
      return sortOrder === 'desc' ? comparison * -1 : comparison;
    });

    // --- Prepare final response ---
    const finalResultsForDisplay = enhancedResults.slice(0, 40);
    const allCount = initialResults.length;
    const movieCount = initialResults.filter(item => item.media_type === 'movie').length;
    const tvCount = initialResults.filter(item => item.media_type === 'tv').length;

    const responseData = {
      data: finalResultsForDisplay,
      counts: { all: allCount, movie: movieCount, tv: tvCount }
    };

    processedCache.set(processedCacheKey, responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
}
