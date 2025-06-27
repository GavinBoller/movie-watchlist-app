import { fetcher } from '../../utils/fetcher';
import NodeCache from 'node-cache';
import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth/[...nextauth]" // Adjust path if needed

// Cache for TMDB watch provider responses.
const providersCache = new NodeCache({ stdTTL: 3600 * 6 }); // 6-hour TTL

export default async function handler(req, res) {
  const { tmdbId, media_type } = req.query;
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;

  if (!tmdbId || !media_type) {
    return res.status(400).json({ error: 'Missing tmdbId or media_type query parameters.' });
  }

  // Default to user's country or Australia if not set
  const country = session.user.country || 'AU';

  const cacheKey = `tmdb:providers:${tmdbId}:${media_type}:${country}`;
  const cachedProviders = providersCache.get(cacheKey);

  if (cachedProviders) {
    console.log(`TMDB Providers Cache hit for ${cacheKey}`);
    return res.status(200).json({ providers: cachedProviders });
  }

  try {
    const url = `https://api.themoviedb.org/3/${media_type}/${tmdbId}/watch/providers?language=${country}`;
    const data = await fetcher(url);

    // We are interested in the results for user's selected country
    const resultsForCountry = data.results?.[country];

    if (!resultsForCountry) {
      console.log(`No TMDB provider data found for ${tmdbId} in ${country}`);
      providersCache.set(cacheKey, []); // Cache empty result
      return res.status(200).json({ providers: [] });
    }

    // Extract unique provider names from 'flatrate' (streaming) and 'free'
    const uniqueProviders = new Set();
    if (resultsForCountry.flatrate) {
      resultsForCountry.flatrate.forEach(p => uniqueProviders.add(p.provider_name));
    }
    if (resultsForCountry.free) {
      resultsForCountry.free.forEach(p => uniqueProviders.add(p.provider_name));
    }

    const providersArray = Array.from(uniqueProviders).sort();
    providersCache.set(cacheKey, providersArray);
    res.status(200).json({ providers: providersArray });

  } catch (error) {
    console.error('Error fetching TMDB provider data:', error);
    res.status(500).json({ error: 'Failed to fetch streaming information.' });
  }
}
