// pages/watchlist.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await axios.get('/api/watchlist');
        setWatchlist(response.data);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        alert('Failed to load watchlist.');
      }
    };
    fetchWatchlist();
  }, []);

  const removeFromWatchlist = async (id) => {
    try {
      await axios.delete('/api/watchlist', { data: { id } });
      setWatchlist(watchlist.filter((item) => item.id !== id));
      alert('Item removed from watchlist!');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('Failed to remove from watchlist.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">My Watchlist</h1>
        <Link href="/" className="block text-center text-blue-400 hover:underline mb-4">
          Back to Search
        </Link>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {watchlist.map((item) => (
            <div key={item.id} className="bg-gray-800 p-4 rounded shadow">
              {item.poster && (
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.poster}`}
                  alt={item.title}
                  className="w-full h-auto rounded mb-2"
                />
              )}
              <h2 className="text-lg font-semibold text-center">{item.title}</h2>
              <p className="text-sm text-gray-400 text-center">
                {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </p>
              <button
                onClick={() => removeFromWatchlist(item.id)}
                className="bg-red-600 text-white py-2 rounded w-full hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}