import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import axios from 'axios';
import { sanitizeInput, validateInput } from '../../lib/security';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req, res) {
  // Set headers to prevent caching of this dynamic response
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Validate and sanitize query parameters
  const { id, media_type } = sanitizeInput(req.query);

  // Validate required parameters
  const validation = validateInput(
    { id, media_type },
    {
      id: { required: true },
      media_type: { type: 'string', enum: ['movie', 'tv'], required: true }
    }
  );

  if (!validation.isValid) {
    return res.status(400).json({ 
      error: 'Invalid parameters', 
      details: validation.errors 
    });
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
        timeout: 5000, // Set a timeout for the request
      }
    );

    const details = detailsResponse.data;

    // Extract watch providers specifically for the user's country
    const watchProviders = details['watch/providers']?.results?.[userCountry];

    return res.status(200).json({ ...details, watch_providers: watchProviders });
  } catch (error) {
    console.error(`Error fetching TMDB details for ${media_type} ID ${id}:`, error.message);
    
    // Don't expose sensitive details in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (error.response) {
      // TMDB API returned an error
      const statusCode = error.response.status;
      const errorMessage = isProduction 
        ? 'Error fetching data from TMDB' 
        : error.response.data?.status_message || 'TMDB API error';
        
      return res.status(statusCode).json({ 
        error: errorMessage,
        code: isProduction ? undefined : error.response.data?.status_code
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      // Request timeout
      return res.status(504).json({ error: 'Request to external API timed out' });
    }
    
    // Generic server error
    return res.status(500).json({ 
      error: 'Failed to fetch details from external API' 
    });
  }
}
