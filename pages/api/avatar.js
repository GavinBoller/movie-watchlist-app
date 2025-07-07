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
  let decodedUrl = decodeURIComponent(url);
  
  // Handle HTML entity encoding
  const htmlEntities = {
    '&#x2F;': '/',
    '&#x3A;': ':',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x3D;': '='
  };
  
  // Replace HTML entities
  for (const [entity, char] of Object.entries(htmlEntities)) {
    decodedUrl = decodedUrl.replace(new RegExp(entity, 'g'), char);
  }
  
  if (!decodedUrl.startsWith('https://lh3.googleusercontent.com/')) {
    return res.status(403).json({ error: 'Invalid image domain' });
  }

  try {
    const response = await axios({
      method: 'get',
      url: decodedUrl, // Use the already decoded URL
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
    
    // Return a fallback SVG that matches the UserCircle icon styling
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable'); // Cache fallback for 1 hour
    res.status(200).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="5"/>
        <path d="M20 21a8 8 0 0 0-16 0"/>
      </svg>
    `.trim());
  }
}

// Validation schema for the avatar proxy
const avatarSchema = Joi.object({
  url: Joi.string()
    .required()
    .messages({
      'any.required': 'Image URL is required'
    })
});

export default secureApiHandler(handler, {
  allowedMethods: ['GET'],
  validationSchema: avatarSchema,
  requireAuth: false // Public access for avatar images
});
