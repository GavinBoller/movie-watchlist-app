/* pages/index.js */
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder

  const searchMedia = async (query) => {
    console.log('Search button clicked with query:', query);
    console.log('NEXT_PUBLIC_TMDB_API_KEY:', process.env.NEXT_PUBLIC_TMDB_API_KEY);
    if (!query.trim()) {
      console.log('Empty query');
      setError('Please enter a search term.');
      return;
    }
    try {
      console.log('Searching TMDB with query:', query);
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      console.log('TMDB response:', response.data);
      const results = response.data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
      setSearchResults(results);
      setError(null);
    } catch (error) {
      console.error('TMDB error:', error.response ? error.response.data : error.message);
      setError('Failed to search media. Please try again later.');
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
            <Link href="/watchlist" className="text-primary hover:underline text-lg">
              Watchlist
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
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-lg">
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies or TV shows..."
              className="w-full p-3 pl-10 bg-gray-800 text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-lg"
            />
            <svg
              className="absolute left-3 top-3.5 h-6 w-6 text-muted-foreground"
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
              className="ml-3 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg"
            >
              Search
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {searchResults.map((item) => (
            <div key={`${item.media_type}-${item.id}`} className="bg-card text-card-foreground p-6 rounded-lg shadow-lg">
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-full h-auto rounded-lg mb-4"
                />
              )}
              <h2 className="text-xl font-semibold text-center mb-2">{item.title || item.name}</h2>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </p>
              <Link
                href={`/media/${item.media_type}/${item.id}`}
                className="block text-center bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 text-lg"
              >
                More Info
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
