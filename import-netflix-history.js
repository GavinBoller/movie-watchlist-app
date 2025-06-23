// import-netflix-history.js
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import axios from 'axios';
import NodeCache from 'node-cache';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables. Prioritize .env.local (used by Next.js) and fallback to .env.
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('Loaded environment variables from .env.local');
} else {
  dotenv.config();
}

// --- Configuration ---
// Path to your Netflix viewing history CSV file
const NETFLIX_CSV_PATH = path.join(process.cwd(), 'NetflixViewingHistory.csv');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const DATABASE_URL = process.env.DATABASE_URL;
// The user ID in your database to associate the imported watchlist items with
const USER_ID = process.env.IMPORT_USER_ID; 

// Validate essential environment variables
if (!TMDB_API_KEY || !DATABASE_URL || !USER_ID) {
  console.error('Missing environment variables. Please set TMDB_API_KEY, DATABASE_URL, and IMPORT_USER_ID in your .env file.');
  process.exit(1);
}

// --- Caching for TMDB API calls ---
// Cache TMDB lookups for 1 week to speed up repeated runs and avoid rate limits
const tmdbCache = new NodeCache({ stdTTL: 3600 * 24 * 7 });

// --- TMDB Fetcher ---
// A utility function to fetch data from TMDB, with caching
const tmdbFetcher = async (url, params = {}) => {
  const cacheKey = `tmdb:${url}:${JSON.stringify(params)}`;
  const cachedData = tmdbCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}${url}`, {
      params: {
        api_key: TMDB_API_KEY,
        ...params,
      },
    });
    tmdbCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching from TMDB: ${url} - ${error.message}`);
    // Return null for 404 (Not Found) or 429 (Rate Limit) errors,
    // so the script can gracefully handle missing TMDB entries.
    if (error.response && (error.response.status === 404 || error.response.status === 429)) {
        return null;
    }
    throw error; // Re-throw other unexpected errors
  }
};

// --- Database Connection ---
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Often required for Neon connections, adjust if your setup differs
  },
});

// Log database connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1); // Exit process if a critical DB error occurs
});

// --- Helper Functions ---

/**
 * Extracts the main title for search from a Netflix viewing history entry.
 * This function is crucial for handling TV show episode titles by stripping
 * episode/season/part information, so we search for the main show.
 * For movies or titles without such indicators, the full title is used.
 * @param {string} netflixTitle - The title string from the Netflix CSV.
 * @returns {string} The cleaned title suitable for TMDB search.
 */
function getSearchTitle(netflixTitle) {
    let cleanedTitle = netflixTitle.trim();

    // 1. Strip explicit season/episode/part indicators
    // These are ordered from most specific to less specific.
    const explicitEpisodePatterns = [
        /:\s*Season\s+\d+\s*:\s*Episode\s+\d+.*$/i, // e.g., ": Season 6: Episode 1: Joan Is Awful"
        /:\s*Season\s+\d+.*$/i,                     // e.g., ": Season 6: Joan Is Awful"
        /:\s*Episode\s+\d+.*$/i,                    // e.g., ": Episode 1: Pilot"
        /:\s*Part\s+\d+.*$/i,                       // e.g., ": Part 1: The Beginning"
        /:\s*Chapter\s+\d+.*$/i,                    // e.g., ": Chapter 1"
        /:\s*Book\s+\d+.*$/i,                       // e.g., ": Book 1"
        /:\s*Vol\.\s+\d+.*$/i,                      // e.g., ": Vol. 1"
        /:\s*Series\s+\d+.*$/i,                     // e.g., ": Series 1: Episode 1" (for Top Boy: Summerhouse)
    ];

    for (const pattern of explicitEpisodePatterns) {
        const match = cleanedTitle.match(pattern);
        if (match) {
            cleanedTitle = cleanedTitle.substring(0, match.index).trim();
            return getSearchTitle(cleanedTitle); // Recurse to handle multiple layers (e.g., "Show: Season X: Episode Y")
        }
    }

    // 2. Handle "Limited Series" specifically
    // If "Limited Series" is followed by an episode number or a quoted title, strip it.
    // Otherwise, assume "Limited Series" is part of the main title.
    const limitedSeriesEpisodePattern = /:\s*Limited Series:\s*(?:Episode\s+\d+|'[^']+'|".*?").*$/i;
    const matchLimited = cleanedTitle.match(limitedSeriesEpisodePattern);
    if (matchLimited) {
        cleanedTitle = cleanedTitle.substring(0, matchLimited.index).trim();
        return getSearchTitle(cleanedTitle); // Recurse
    }

    // 3. General heuristic for stripping the last colon-separated part
    // This is for cases like "The Four Seasons: Fun" or "American Murder: Gabby Petito: Burn After Reading"
    // where the last part is an episode title but not in a standard "Episode X" format.
    const parts = cleanedTitle.split(':');
    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1].trim();
        // Heuristic: if the last part is relatively short (e.g., < 50 chars)
        // and doesn't contain a year (to avoid stripping movie subtitles like "Movie Title: The Year (2023)"),
        // it's likely an episode title.
        const looksLikeEpisodeTitle = lastPart.length < 50 && !/\(\d{4}\)/.test(lastPart);
        if (looksLikeEpisodeTitle) {
            cleanedTitle = parts.slice(0, parts.length - 1).join(':').trim();
            return getSearchTitle(cleanedTitle); // Recurse
        }
    }

    // Final check: if the title ends with a colon, remove it.
    if (cleanedTitle.endsWith(':')) {
        cleanedTitle = cleanedTitle.slice(0, -1).trim();
    }

    return cleanedTitle;
}

/**
 * Fetches detailed information for a specific TMDB item.
 * @param {number} tmdbId - The TMDB ID of the movie or TV show.
 * @param {string} mediaType - The media type ('movie' or 'tv').
 * @returns {Promise<object|null>} An object with detailed info, or null if not found/error.
 */
async function fetchTmdbDetails(tmdbId, mediaType) {
  if (!tmdbId || !mediaType) return null;
  try {
    const detailsUrl = `/${mediaType}/${tmdbId}?append_to_response=external_ids`;
    const details = await tmdbFetcher(detailsUrl); // Use the existing tmdbFetcher
    if (!details) return null;

    return {
      imdb_id: details.external_ids?.imdb_id || null,
      genres: details.genres?.map((g) => g.name).join(', ') || null,
      runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]) || null,
      vote_average: details.vote_average ? parseFloat(details.vote_average) : null,
      number_of_seasons: details.number_of_seasons || null,
      number_of_episodes: details.number_of_episodes || null,
      overview: details.overview || null,
      poster_path: details.poster_path || null,
      title: details.title || details.name || null, // Use details title if available
      // Ensure empty strings become null to prevent DB errors
      release_date: (details.release_date || details.first_air_date) || null,
    };
  } catch (error) {
    console.warn(`Failed to fetch full details for TMDB ID ${tmdbId} (${mediaType}):`, error.message);
    return null;
  }
}

/**
 * Searches TMDB for a given title using the multi-search endpoint.
 * It prioritizes exact matches and then falls back to the most popular result.
 * @param {string} title - The cleaned title to search for on TMDB.
 * @returns {Promise<{tmdbId: number, mediaType: string, title: string, releaseDate: string}|null>}
 *          An object containing TMDB ID, media type, title, and release date, or null if not found.
 */
async function searchTmdb(title) {
  const searchResults = await tmdbFetcher('/search/multi', { query: title });

  // If no results or API call failed
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return null;
  }

  // Convert search title to lowercase for case-insensitive comparison
  const lowerTitle = title.toLowerCase();

  // 1. Prioritize exact title matches (case-insensitive)
  const exactMatch = searchResults.results.find(item =>
    (item.media_type === 'movie' && item.title && item.title.toLowerCase() === lowerTitle) ||
    (item.media_type === 'tv' && item.name && item.name.toLowerCase() === lowerTitle)
  );

  if (exactMatch) {
    return {
      tmdbId: exactMatch.id,
      mediaType: exactMatch.media_type,
      title: exactMatch.media_type === 'movie' ? exactMatch.title : exactMatch.name,
      // Ensure empty strings become null to prevent DB errors
      releaseDate: (exactMatch.media_type === 'movie' ? exactMatch.release_date : exactMatch.first_air_date) || null,
    };
  }

  // 2. If no exact match, sort by popularity and apply heuristics:
  //    - Prefer higher popularity.
  //    - If the original Netflix title doesn't contain common TV show indicators,
  //      prioritize movies over TV shows if both have similar popularity.
  const bestMatch = searchResults.results.sort((a, b) => {
    if (a.popularity !== b.popularity) return b.popularity - a.popularity; // Sort by popularity (desc)

    // Heuristic: If the search title doesn't look like a TV episode/season,
    // and both movie/TV results exist, prefer the movie.
    const isATVShowTitle = title.includes('Season') || title.includes('Episode');
    if (!isATVShowTitle && a.media_type === 'movie' && b.media_type === 'tv') return -1;
    if (!isATVShowTitle && a.media_type === 'tv' && b.media_type === 'movie') return 1;
    
    return 0; // Maintain original order if all else is equal
  })[0]; // Take the top result after sorting


  if (bestMatch) {
    return {
      tmdbId: bestMatch.id,
      mediaType: bestMatch.media_type,
      title: bestMatch.media_type === 'movie' ? bestMatch.title : bestMatch.name,
      // Ensure empty strings become null to prevent DB errors
      releaseDate: (bestMatch.media_type === 'movie' ? bestMatch.release_date : bestMatch.first_air_date) || null,
    };
  }

  return null; // No suitable TMDB entry found
}

/**
 * Processes a single Netflix viewing history item:
 * - Looks up the item on TMDB.
 * - Inserts or updates the item in the user's watchlist in the database.
 * @param {object} item - An object containing `netflixTitle` and `watchedDate` from the CSV.
 * @param {pg.PoolClient} client - A PostgreSQL client from the pool (for transaction support).
 * @returns {Promise<boolean>} True if the item was successfully processed (added/updated), false otherwise.
 */
async function processWatchlistItem(item, client) {
  const searchTitle = getSearchTitle(item.netflixTitle);
  const watchedAt = new Date(item.watchedDate);

  // Validate the date from the CSV
  if (isNaN(watchedAt.getTime())) {
    console.warn(`Skipping "${item.netflixTitle}" - Invalid date format: "${item.watchedDate}"`);
    return false;
  }

  // Look up the item on TMDB
  const tmdbInfo = await searchTmdb(searchTitle);

  if (!tmdbInfo) {
    console.warn(`Could not find TMDB entry for search term "${searchTitle}" (original Netflix title: "${item.netflixTitle}")`);
    return false;
  }

  // Fetch full details for the found TMDB item
  const fullDetails = await fetchTmdbDetails(tmdbInfo.tmdbId, tmdbInfo.mediaType);
  if (!fullDetails) {
      console.warn(`Could not fetch full details for "${tmdbInfo.title}" (TMDB ID: ${tmdbInfo.tmdbId}). Skipping.`);
      return false;
  }
  try {
    // Check if the item already exists in the watchlist for the target user
    const existingItem = await client.query(
      'SELECT id, status FROM watchlist WHERE user_id = $1 AND movie_id = $2',
      [USER_ID, tmdbInfo.tmdbId]
    );

    if (existingItem.rows.length > 0) {
      // Item exists: Update its status to 'watched' if it's not already.
      // This prevents overwriting a manually set 'watched' status or a more recent watched_at date.
      const currentStatus = existingItem.rows[0].status;
      if (currentStatus !== 'watched') { // Check if status needs updating
        await client.query(
          'UPDATE watchlist SET status = $1, watched_date = $2 WHERE id = $3',
          ['watched', watchedAt.toISOString().split('T')[0], existingItem.rows[0].id]
        );
        console.log(`Updated "${tmdbInfo.title}" (TMDB ID: ${tmdbInfo.tmdbId}) to 'watched'.`);
      } else {
        console.log(`"${tmdbInfo.title}" (TMDB ID: ${tmdbInfo.tmdbId}) already marked as 'watched'. Skipping update.`);
      }
    } else {
      // Item does not exist: Insert a new record as 'watched'.
      await client.query(
        `INSERT INTO watchlist (
            user_id, movie_id, media_type, status, watched_date, added_at,
            title, overview, poster, release_date, imdb_id, vote_average,
            runtime, seasons, episodes, genres, platform
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
            USER_ID,
            tmdbInfo.tmdbId,
            tmdbInfo.mediaType,
            'watched',
            watchedAt.toISOString().split('T')[0], // Format as YYYY-MM-DD for DATE column
            fullDetails.title || tmdbInfo.title,
            fullDetails.overview,
            fullDetails.poster_path,
            fullDetails.release_date || tmdbInfo.releaseDate,
            fullDetails.imdb_id, fullDetails.vote_average,
            fullDetails.runtime, fullDetails.number_of_seasons, fullDetails.number_of_episodes,
            fullDetails.genres,
            'Netflix' //Add Netflix to the platform
        ]
      );
      console.log(`Added "${tmdbInfo.title}" (TMDB ID: ${tmdbInfo.tmdbId}) to watchlist as 'watched'.`);
    }
    return true;
  } catch (dbError) {
    console.error(`Database error processing "${tmdbInfo.title}" (TMDB ID: ${tmdbInfo.tmdbId}):`, dbError.message);
    return false;
  }
}

// --- Main Import Function ---
async function importNetflixHistory() {
  console.log('Starting Netflix viewing history import process...');
  console.log(`Items will be imported for User ID: ${USER_ID}`);

  const records = [];
  let processedCount = 0;
  let successCount = 0;
  let skippedCount = 0;

  // 1. Read and parse the Netflix CSV file
  console.log(`Reading CSV from: ${NETFLIX_CSV_PATH}`);
  const parser = fs.createReadStream(NETFLIX_CSV_PATH).pipe(
    parse({
      columns: true, // Automatically use the first row as column headers (Title, Date)
      skip_empty_lines: true,
      trim: true, // Trim whitespace from values
    })
  );

  // Collect all records from the CSV stream
  parser.on('data', (row) => {
    records.push({
      netflixTitle: row.Title,
      watchedDate: row.Date,
    });
  });

  // Wait for the CSV parsing to complete
  await new Promise((resolve, reject) => {
    parser.on('end', resolve);
    parser.on('error', reject);
  });

  console.log(`Found ${records.length} entries in the Netflix history CSV.`);

  // 2. Process each Netflix history record with its own transaction
  for (const record of records) {
    processedCount++;
    let client; // Declare client here
    try {
      client = await pool.connect(); // Get a new client for each item
      await client.query('BEGIN'); // Start transaction for this item
      const success = await processWatchlistItem(record, client);
      if (success) {
        await client.query('COMMIT'); // Commit if successful
        successCount++;
      } else {
        await client.query('ROLLBACK'); // Rollback if processWatchlistItem returned false (e.g., TMDB not found)
        skippedCount++;
      }
    } catch (itemError) {
      if (client) { // Only try to rollback if client was successfully acquired
        try {
          await client.query('ROLLBACK'); // Rollback if any unexpected error occurred during processing
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
      }
      console.error(`Critical error processing item "${record.netflixTitle}": ${itemError.message}`);
      skippedCount++; // Count as skipped due to error
    } finally {
      if (client) {
        client.release(); // Always release the client back to the pool
      }
    }
    // Provide progress updates
    if (processedCount % 10 === 0 || processedCount === records.length) {
      console.log(`Processed ${processedCount}/${records.length} entries... (Success: ${successCount}, Skipped: ${skippedCount})`);
    }
  }

  console.log('\nNetflix viewing history import completed successfully!');
  console.log(`Total entries processed: ${processedCount}`);
  console.log(`Successfully imported/updated: ${successCount}`);
  console.log(`Skipped (not found on TMDB or error): ${skippedCount}`);

  // Close the main database connection pool after all items are processed
  await pool.end();
  console.log('Database connection closed.');
}

// Execute the main import function
importNetflixHistory().catch(console.error);
