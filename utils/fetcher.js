const fetcher = async (url) => {
  // This fetcher is now intended for server-side use, where TMDB_API_KEY is available.
  // It correctly appends the api_key as a query parameter for TMDB API v3.
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}api_key=${process.env.TMDB_API_KEY}`);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data from TMDB.');
    try {
      error.info = await res.json();
    } catch (e) {
      // The response might not be JSON, so we just attach the text
      error.info = await res.text();
    }
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

export { fetcher };