// pages/index.js (replace with this version)
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  const searchMedia = async (query) => {
    try {
      console.log('Searching TMDB with query:', query);
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      console.log('TMDB response:', response.data);
      setSearchResults(response.data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv'));
      setError(null);
    } catch (error) {
      console.error('Error searching TMDB:', error.message);
      setError('Failed to search media. Please try again.');
      alert('Failed to search media.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">Movie & TV Watchlist</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="flex justify-center mb-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies or TV shows..."
              className="w-full p-2 pl-10 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <button
              onClick={() => searchMedia(searchQuery)}
              className="ml-2 p-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
        <Link href="/watchlist" className="block text-center text-blue-400 hover:underline mb-4">
          View Watchlist
        </Link>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {searchResults.map((item) => (
            <div key={`${item.media_type}-${item.id}`} className="bg-gray-800 p-4 rounded shadow">
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-full h-auto rounded mb-2"
                />
              )}
              <h2 className="text-lg font-semibold text-center">{item.title || item.name}</h2>
              <p className="text-sm text-gray-400 text-center">
                {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </p>
              <Link
                href={`/media/${item.media_type}/${item.id}`}
                className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                More Info
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}