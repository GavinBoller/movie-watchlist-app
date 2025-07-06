import { fetcher } from '../../utils/fetcher';
import NodeCache from 'node-cache';
import { secureApiHandler } from '../../lib/secureApiHandler';
import Joi from 'joi';

// Cache for TMDB watch provider responses.
const providersCache = new NodeCache({ stdTTL: 3600 * 6 }); // 6-hour TTL

async function handler(req, res) {
  const { tmdbId, media_type } = req.query;
  const userId = req.session?.user?.id;

  // Default to user's country or Australia if not set
  const country = req.session?.user?.country || 'AU';

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
    throw error; // Let secureApiHandler handle this error
  }
}

// Validation schema for API parameters
const whereToWatchSchema = Joi.object({
  tmdbId: Joi.alternatives().try(
    Joi.number().required(),
    Joi.string().pattern(/^\d+$/).required()
  ).messages({
    'any.required': 'TMDB ID is required',
    'string.pattern.base': 'TMDB ID must be a number'
  }),
  media_type: Joi.string().valid('movie', 'tv').required().messages({
    'any.required': 'Media type is required',
    'any.only': 'Media type must be either "movie" or "tv"'
  })
});

export default secureApiHandler(handler, {
  allowedMethods: ['GET'],
  validationSchema: whereToWatchSchema,
  requireAuth: true
});
