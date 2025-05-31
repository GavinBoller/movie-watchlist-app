const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

console.log('Environment variables loaded:', Object.keys(process.env).filter(key => key.includes('TMDB') || key.includes('DATABASE')));

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error('Error: NEXT_PUBLIC_TMDB_API_KEY is not set in .env.local');
  process.exit(1);
}

async function validateTMDBKey() {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`TMDB API key validation failed: ${res.status} ${errorText}`);
    }
    console.log('TMDB API key validated successfully');
    return true;
  } catch (error) {
    console.error('Error validating TMDB API key:', error.message);
    return false;
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTMDBData(type, page) {
  const url = `https://api.themoviedb.org/3/${type}/popular?api_key=${TMDB_API_KEY}&page=${page}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch ${type} data: ${res.status} ${errorText}`);
    }
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error(`Error fetching ${type} page ${page}:`, error.message);
    return [];
  }
}

async function fetchDetails(type, id) {
  const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch details for ${type}/${id}: ${res.status} ${errorText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching details for ${type}/${id}:`, error.message);
    return null;
  }
}

async function generateTestData() {
  try {
    const isValidKey = await validateTMDBKey();
    if (!isValidKey) {
      console.error('Aborting: Invalid TMDB API key');
      process.exit(1);
    }

    const userId = 1;
    const items = [];
    
    // Fetch 40 pages of movies and TV shows (20 items/page)
    for (let page = 1; page <= 40; page++) {
      console.log(`Fetching page ${page}...`);
      const movies = await fetchTMDBData('movie', page);
      const tvShows = await fetchTMDBData('tv', page);
      items.push(...movies.map(item => ({ ...item, media_type: 'movie' })));
      items.push(...tvShows.map(item => ({ ...item, media_type: 'tv' })));
      await delay(100);
    }

    // Remove duplicates by id
    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
    console.log(`Fetched ${uniqueItems.length} unique items`);

    // Fetch existing movie_ids
    const existing = await pool.query('SELECT movie_id FROM watchlist WHERE user_id = $1', [userId]);
    const existingIds = new Set(existing.rows.map(row => row.movie_id));

    // Insert new items
    let inserted = 0;
    for (const item of uniqueItems) {
      if (existingIds.has(item.id.toString())) {
        console.log(`Skipping existing movie_id: ${item.id}`);
        continue;
      }

      const details = await fetchDetails(item.media_type, item.id);
      if (!details) continue;

      const status = ['to_watch', 'watching', 'watched'][Math.floor(Math.random() * 3)];
      const platform = ['Netflix', 'Amazon Prime', 'Disney+', null][Math.floor(Math.random() * 4)];

      try {
        await pool.query(
          `INSERT INTO watchlist (
            user_id, movie_id, title, overview, poster, release_date, media_type, status, platform,
            imdb_id, vote_average, seasons, episodes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            userId,
            item.id.toString(),
            item.title || item.name || 'Unknown',
            item.overview || null,
            item.poster_path || null,
            item.release_date || item.first_air_date || null,
            item.media_type,
            status,
            platform,
            details.external_ids?.imdb_id || null,
            details.vote_average ? parseFloat(details.vote_average) : null,
            item.media_type === 'tv' ? details.number_of_seasons || null : null,
            item.media_type === 'tv' ? details.number_of_episodes || null : null,
          ]
        );
        inserted++;
        existingIds.add(item.id.toString());
        console.log(`Inserted item ${inserted}: ${item.title || item.name} (${item.id})`);
      } catch (error) {
        console.error(`Error inserting item ${item.id}:`, error.message);
      }
      await delay(100);
      if (inserted >= 1500) break;
    }

    console.log(`Inserted ${inserted} new items`);
    const count = await pool.query('SELECT COUNT(*) FROM watchlist');
    console.log(`Total watchlist items: ${count.rows[0].count}`);
  } catch (error) {
    console.error('Error generating test data:', error);
  } finally {
    await pool.end();
  }
}

generateTestData();