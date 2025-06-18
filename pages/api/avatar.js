import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  // Validate the URL to ensure it's from a trusted domain (optional but recommended)
  // For example, only allow lh3.googleusercontent.com
  if (!url.startsWith('https://lh3.googleusercontent.com/')) {
    return res.status(403).json({ error: 'Invalid image domain' });
  }

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer', // Fetch as a buffer
    });

    // Get content type from the original response
    const contentType = response.headers['content-type'] || 'image/jpeg'; // Default if not found

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // Cache for 1 day
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error proxying image:', error.message);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}