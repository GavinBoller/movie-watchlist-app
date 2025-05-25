/* pages/watchlist.js */
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        console.log('Fetching watchlist');
        const response = await axios.get('/api/watchlist');
        console.log('Watchlist response:', response.data);
        setWatchlist(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching watchlist:', error.message);
        setError('Failed to load watchlist.');
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
      console.error('Error removing from watchlist:', error.message);
      alert('Failed to remove from watchlist.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-4">
      <header className="bg-background border-b border-border mb-6">
        <div className="container mx-auto max-w-6xl py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-foreground">
            Watchlist
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-primary hover:underline text-lg">
              Search
            </Link>
            {isLoggedIn ? (
              <>
                <span className="text-foreground">Welcome, User</span>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted text-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsLoggedIn(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 text-lg"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto max-w-6xl">
        {error && <p className="text-destructive text-center mb-6">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {watchlist.map((item) => (
            <div key={item.id} className="bg-card text-card-foreground p-6 rounded-lg shadow-lg">
              {item.poster && (
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.poster}`}
                  alt={item.title}
                  className="w-full h-auto rounded-lg mb-4"
                />
              )}
              <h2 className="text-xl font-semibold text-center mb-2">{item.title}</h2>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </p>
              <button
                onClick={() => removeFromWatchlist(item.id)}
                className="bg-destructive text-destructive-foreground py-3 rounded-lg w-full hover:bg-destructive/90 text-lg"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
