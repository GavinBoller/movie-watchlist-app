import { fetcher } from '../../utils/fetcher';

export default async function handler(req, res) {
  const { query, media_type = 'all', genre = 'all', sort_by = 'popularity.desc' } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const type = media_type === 'all' ? 'multi' : media_type;
    const url = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(query)}&sort_by=${sort_by}${
      genre !== 'all' ? `&with_genres=${genre}` : ''
    }`;
    const data = await fetcher(url);
    res.status(200).json({ data: data.results || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
}