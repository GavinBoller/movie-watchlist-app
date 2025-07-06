import axios from 'axios';
import { secureApiHandler } from '../../lib/secureApiHandler';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function handler(req, res) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/configuration/countries`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });
    // TMDB returns an array of country objects, each with iso_3166_1 and english_name
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching countries from TMDB:', error.message);
    res.status(error.response?.status || 500).json({ message: 'Failed to fetch countries from TMDB.' });
  }
}

export default secureApiHandler(handler, {
  allowedMethods: ['GET'],
  requireAuth: false
});