import { useState } from 'react';
import MovieCard from '../components/MovieCard';
import DetailsModal from '../components/DetailsModal';
import { Menu, Film, Tv2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const { addToast } = useToast();

  const mediaTypeFilters = [
    { value: 'all', label: 'All', icon: Menu },
    { value: 'movie', label: 'Movies', icon: Film },
    { value: 'tv', label: 'TV Shows', icon: Tv2 },
  ];

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setResults([]);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error('Failed to fetch results');
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      setErrorMsg('Error fetching search results.');
      setResults([]);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to fetch search results.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (result) => {
    const media = {
      id: String(result.id),
      title: result.title || result.name,
      overview: result.overview,
      poster: result.poster_path,
      release_date: result.release_date || result.first_air_date,
      media_type: result.media_type,
    };

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(media),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add to watchlist');
      addToast({
        id: Date.now(),
        title: 'Success!',
        description: `${media.title} added to watchlist`,
      });
    } catch (error) {
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to add to watchlist: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const filteredResults = results.filter((result) => {
    if (mediaFilter === 'all') return true;
    return result.media_type === mediaFilter;
  });

  const handleSuggestionClick = (term) => {
    setQuery(term);
    handleSearch(term);
  };

  const handleInfoClick = (item) => {
    setSelectedItem(item);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for movies or TV shows..."
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          aria-label="Search for movies or TV shows"
        />
        <button
          onClick={() => handleSearch()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Media Type Filters */}
      <div className="mb-4">
        {/* Desktop: Horizontal Buttons (Centered) */}
        <div className="hidden sm:flex gap-2 justify-center">
          {mediaTypeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setMediaFilter(filter.value)}
              className={`flex items-center px-4 py-2 rounded ${
                mediaFilter === filter.value
                  ? 'bg-gray-700 text-[#E50914]'
                  : 'bg-gray-800 text-white hover:bg-gray-700 hover:text-[#E50914] transition-colors'
              }`}
            >
              <filter.icon className="h-4 w-4 mr-2" />
              {filter.label}
            </button>
          ))}
        </div>
        {/* Mobile: Dropdown (Centered) */}
        <div className="sm:hidden flex justify-center">
          <select
            value={mediaFilter}
            onChange={(e) => setMediaFilter(e.target.value)}
            className="w-full max-w-xs p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          >
            {mediaTypeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Content Area */}
      {query && (
        <h2
          className={`text-lg sm:text-xl font-bold mb-4 ${
            query ? '' : 'hidden'
          }`}
        >
          {query && `${filteredResults.length} Results for "${query}"`}
        </h2>
      )}

      {errorMsg && (
        <div className="mb-4 text-red-400">{errorMsg}</div>
      )}

      {!loading && !query && (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto bg-[#292929] rounded-lg p-4">
            <Film className="h-8 w-8 mx-auto mb-3 text-[#E50914]" />
            <p className="text-gray-300 mb-4">
              Enter a movie or TV show title in the search box to begin exploring
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                onClick={() => handleSuggestionClick("Marvel")}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Try "Marvel"
              </button>
              <button
                onClick={() => handleSuggestionClick("Star Wars")}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Try "Star Wars"
              </button>
              <button
                onClick={() => handleSuggestionClick("Breaking Bad")}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Try "Breaking Bad"
              </button>
              <button
                onClick={() => handleSuggestionClick("Stranger Things")}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Try "Stranger Things"
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredResults.map((result) => (
          <MovieCard
            key={result.id}
            result={result}
            onAddToWatchlist={handleAddToWatchlist}
            onInfoClick={handleInfoClick}
          />
        ))}
      </div>

      {!loading && results.length === 0 && query && !errorMsg && (
        <div className="mt-8 text-center text-gray-400">No results found.</div>
      )}

      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToWatchlist={handleAddToWatchlist}
        />
      )}
    </div>
  );
}
