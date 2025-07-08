import axios from 'axios';
import { secureApiHandler } from '../../lib/secureApiHandler';
import Joi from 'joi';

async function handler(req, res) {
  const { url } = req.query;

  // URL validation is also handled by the Joi schema, but this is a double-check
  if (!url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  // Validate the URL to ensure it's from a trusted domain (Google profile images)
  if (!url.startsWith('https://lh3.googleusercontent.com/')) {
    return res.status(403).json({ error: 'Invalid image domain' });
  }

  try {
    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      responseType: 'arraybuffer', // Fetch as a buffer
      timeout: 5000, // Add timeout to prevent hanging requests
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MovieWatchlistApp/1.0)'
      }
    });

    // Get content type from the original response
    const contentType = response.headers['content-type'] || 'image/jpeg'; // Default if not found

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // Cache for 1 day
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error proxying image:', error.message);
    
    // Return a fallback image instead of an error
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`);
  }
}

// Validation schema for the avatar proxy
const avatarSchema = Joi.object({
  url: Joi.string()
    .uri()
    .pattern(/^https:\/\/lh3\.googleusercontent\.com\//)
    .required()
    .messages({
      'string.uri': 'URL must be a valid URI',
      'string.pattern.base': 'URL must be from a trusted domain (lh3.googleusercontent.com)',
      'any.required': 'Image URL is required'
    })
});

export default secureApiHandler(handler, {
  allowedMethods: ['GET'],
  validationSchema: avatarSchema,
  requireAuth: false // Public access for avatar images
});
