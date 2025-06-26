// search.js
import { fetcher } from '../../utils/fetcher';
import NodeCache from 'node-cache';

// Cache for raw, multi-page TMDB search results. Longer TTL since this data is less specific.
const rawSearchCache = new NodeCache({ stdTTL: 3600 * 6 }); // 6-hour TTL

// Cache for final, processed (filtered, sorted, enhanced) results. Shorter TTL.
const processedCache = new NodeCache({ stdTTL: 3600 }); // 1-hour TTL

// --- Helper Functions ---

/**
 * Safely parses a date string into a Date object.
 * @param {string} dateStr - The date string to parse.
 * @returns {Date|null} A Date object or null if the string is invalid.
 */
const parseDate = (dateStr) => {
  if (!dateStr) return null; // Handle null, undefined, or empty string
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date; // Return null for invalid dates
};

/**
 * Fetches the initial list of results from TMDB, either via search or discover endpoints.
 * Manages the raw search cache.
 * @param {object} params - The request parameters.
 * @returns {Promise<Array>} A promise that resolves to an array of raw results.
 */
async function fetchInitialResults({ query, media_type, genre_id, min_rating, sort_by, discovery_mode }) {
  let initialResults = [];
  const useDiscover = !query || discovery_mode !== 'text'; // Use discover logic if no query or in discovery mode

  if (useDiscover) {
    // DISCOVER LOGIC (for filter-based browsing without a text query, or for discovery modes)
    const fetchDiscoverPage = async (type, page) => {
      let url;
      let currentSortBy = sort_by; // Default sort_by from request

      if (discovery_mode === 'top_rated') {
        url = `https://api.themoviedb.org/3/${type}/top_rated?page=${page}`;
      } else if (discovery_mode === 'popular') {
        url = `https://api.themoviedb.org/3/${type}/popular?page=${page}`;
      } else if (discovery_mode === 'latest') {
        // TMDB's /latest endpoint only returns a single item.
        // For a list of latest releases, discover with appropriate sorting is better.
        url = `https://api.themoviedb.org/3/discover/${type}?page=${page}&sort_by=primary_release_date.desc`;
      } else {
        // Default discover for when query is empty but not in a specific discovery mode
        url = `https://api.themoviedb.org/3/discover/${type}?page=${page}&sort_by=${currentSortBy}`;
      }
      
      if (genre_id !== 'all') url += `&with_genres=${genre_id}`;
      if (min_rating !== '0') url += `&vote_average.gte=${min_rating}`;

      // For 'latest' mode, add date range filters
      if (discovery_mode === 'latest') {
        const today = new Date().toISOString().split('T')[0];
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
        
        if (type === 'movie') {
          url += `&primary_release_date.lte=${today}&primary_release_date.gte=${threeMonthsAgoStr}`;
        } else { // tv
          url += `&first_air_date.lte=${today}&first_air_date.gte=${threeMonthsAgoStr}`;
        }
      }

      const data = await fetcher(url);
      // Add media_type since discover endpoint doesn't provide it
      return (data.results || []).map(item => {
        // Ensure 'poster' is mapped from 'poster_path' for consistency with watchlist items
        // and to avoid issues in frontend components expecting 'poster'.
        const poster = item.poster_path || null;
        return {
          ...item,
          media_type: item.media_type || type, // Use existing media_type if present, else default to type
          poster: poster, // Map poster_path to poster
          // Ensure release_date/first_air_date are consistently named
          release_date: item.release_date || item.first_air_date || null,
        };
      });
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
    // SEARCH LOGIC (for text-based queries with server-side filtering)
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
  return initialResults;
}

/**
 * Standardizes result structure, applies filters, and calculates relevance scores.
 * @param {Array} initialResults - The raw results from TMDB.
 * @param {object} params - The request parameters.
 * @returns {Array} The processed and filtered results.
 */
function standardizeAndFilterResults(initialResults, { query, media_type, genre_id, min_rating }) {
  let processedResults = initialResults.map(item => ({
    ...item, // Keep all original properties like poster_path, overview, etc.
    title: item.title || item.name, // Standardize title
    release_date: item.release_date || item.first_air_date || null, // Standardize release date to null if missing
    popularity: item.popularity || 0, // Ensure popularity is always a number
  }));

  // The 'excludeWatchlist' filtering is handled on the frontend (pages/search.js)
  // as the 'watchlist' context is available there.
  if (media_type !== 'all') {
    processedResults = processedResults.filter(item => item.media_type === media_type);
  }
  if (genre_id !== 'all') {
    const numericGenreId = parseInt(genre_id, 10);
    processedResults = processedResults.filter(item => item.genre_ids && item.genre_ids.includes(numericGenreId));
  }
  if (min_rating !== '0') {
    const numericMinRating = parseFloat(min_rating);
    processedResults = processedResults.filter(item => item.vote_average && item.vote_average >= numericMinRating);
  }

  if (query) {
    const queryLower = query.toLowerCase();
    processedResults.forEach(item => {
      const title = (item.title || '').toLowerCase();
      let score = 0;
      if (title === queryLower) score = 3;
      else if (title.startsWith(queryLower)) score = 2;
      else if (title.includes(queryLower)) score = 1;
      item.relevanceScore = score;
    });
  } else {
    processedResults.forEach(item => item.relevanceScore = 0);
  }
  return processedResults;
}

/**
 * Fetches detailed information for the top results to enrich the data.
 * @param {Array} filteredResults - The list of filtered results.
 * @returns {Promise<Array>} A promise that resolves to an array of enhanced results.
 */
async function enhanceTopResults(filteredResults) {
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
          ...item,
          imdb_id: details.external_ids?.imdb_id || null,
          genres: details.genres?.map((g) => g.name).join(', ') || 'N/A',
          runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]) || null,
          release_date: details.release_date || item.release_date,
          vote_average: details.vote_average ? parseFloat(details.vote_average) : item.vote_average,
          number_of_seasons: details.number_of_seasons || null,
          number_of_episodes: details.number_of_episodes || null,
        };
      } catch (error) {
        console.warn(`Failed to fetch details for ${item.id}:`, error);
        return item;
      }
    })
  );
  return enhancedResults.filter(Boolean);
}

/**
 * Sorts the final list of results based on the user's selection.
 * @param {Array} results - The array of enhanced results to sort.
 * @param {object} params - The request parameters, including `sort_by`.
 * @returns {Array} The fully sorted array of results.
 */
function sortFinalResults(results, { query, sort_by }) {
  results.sort((a, b) => {
    const [sortField, sortOrder] = sort_by.split('.');

    if (query && sortField === 'popularity') {
      const scoreA = a.relevanceScore || 0;
      const scoreB = b.relevanceScore || 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
    }

    const getComparable = (item, field) => {
      switch (field) {
        case 'release_date':
          return parseDate(item.release_date);
        case 'title':
          return (item.title || '').toLowerCase();
        case 'vote_average':
        case 'popularity':
          return parseFloat(item[field]) || 0;
        default:
          return item[field];
      }
    };

    const valA = getComparable(a, sortField);
    const valB = getComparable(b, sortField); // Corrected line

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
        comparison = valA.getTime() - valB.getTime();
        break;
      case 'vote_average':
      case 'popularity':
        comparison = valA - valB;
        break;
      default:
        comparison = getComparable(a, 'popularity') - getComparable(b, 'popularity');
        return comparison * -1;
    }

    if (comparison === 0 && sortField !== 'popularity') {
      return getComparable(b, 'popularity') - getComparable(a, 'popularity');
    }

    return sortOrder === 'desc' ? comparison * -1 : comparison;
  });
  return results;
}

// --- Main API Handler ---
export default async function handler(req, res) {
  const {
    query,
    media_type = 'all',
    genre_id = 'all',
    min_rating = '0',
    sort_by = 'popularity.desc',
    page = '1',
    limit = '40',
    discovery_mode = 'text', // Default to 'text' search
  } = req.query;

  // If in text search mode and no query/filters, return empty
  if (discovery_mode === 'text' && !query && genre_id === 'all' && min_rating === '0') {
    return res.status(200).json({ data: [], counts: { all: 0, movie: 0, tv: 0 } });
  }
  
  const processedCacheKey = `tmdb:processed:${query}:${media_type}:${genre_id}:${min_rating}:${sort_by}:${page}:${limit}:${discovery_mode}`;
  const cachedProcessed = processedCache.get(processedCacheKey);
  if (cachedProcessed) {
    console.log(`Processed Cache hit for ${processedCacheKey}`);
    return res.status(200).json(cachedProcessed);
  }
  
  try {
    // 1. Fetch initial results (from TMDB or raw cache)
    const initialResults = await fetchInitialResults({
      query, // This will be empty for discovery modes
      media_type,
      genre_id,
      min_rating,
      sort_by,
      discovery_mode, // Pass discovery_mode to fetchInitialResults
    });

    // 2. Standardize, filter, and apply relevance scoring
    const filteredAndScoredResults = standardizeAndFilterResults(initialResults, { query, media_type, genre_id, min_rating });

    // 3. Enhance top results with detailed information
    const enhancedResults = await enhanceTopResults(filteredAndScoredResults);

    // 4. Sort the final results
    const finalSortedResults = sortFinalResults(enhancedResults, { query, sort_by });
    
    // 5. Prepare final response
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const finalResultsForDisplay = finalSortedResults.slice(startIndex, endIndex);
    const totalResults = finalSortedResults.length;
    
    // Recalculate counts based on the *filtered* results for accuracy
    const allCount = filteredAndScoredResults.length;
    const movieCount = filteredAndScoredResults.filter(item => item.media_type === 'movie').length;
    const tvCount = filteredAndScoredResults.filter(item => item.media_type === 'tv').length;
    
    const responseData = {
      data: finalResultsForDisplay,
      total: totalResults,
      counts: { all: allCount, movie: movieCount, tv: tvCount }
    };
    
    processedCache.set(processedCacheKey, responseData);
    res.status(200).json(responseData);
  
  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
}
