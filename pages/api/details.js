import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req, res) {
  // Set headers to prevent caching of this dynamic response
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { id, media_type } = req.query;

  if (!id || !media_type) {
    return res.status(400).json({ message: 'Missing id or media_type parameter.' });
  }

  if (media_type !== 'movie' && media_type !== 'tv') {
    return res.status(400).json({ message: 'Invalid media_type. Must be "movie" or "tv".' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  // Simplified and robust way to get the user's country.
  // It directly uses the country from the session token, which is populated by the NextAuth.js callbacks.
  // If the user is not logged in or the country is not set, it defaults to 'AU'.
  const userCountry = session?.user?.country || 'AU';

  try {
    // Fetch main details and append watch providers
    const detailsResponse = await axios.get(
      `${TMDB_BASE_URL}/${media_type}/${id}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'credits,videos,external_ids,watch/providers',
        },
      }
    );

    const details = detailsResponse.data;

    // Extract watch providers specifically for the user's country
    const watchProviders = details['watch/providers']?.results?.[userCountry];

    return res.status(200).json({ ...details, watch_providers: watchProviders });
  } catch (error) {
    console.error(`Error fetching TMDB details for ${media_type} ID ${id}:`, error.message);
    if (error.response) {
      console.error('TMDB API Error Response:', error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: 'Failed to fetch details from TMDB.' });
  }
}
