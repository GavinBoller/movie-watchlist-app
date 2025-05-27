'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import DetailsModal from '../components/DetailsModal';
import { Search, ExternalLink, Film, Menu, Tv2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ToastContext';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [mediaFilter, setMediaFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToAdd, setItemToAdd] = useState(null);
  const { addToast } = useToast();

  const mediaTypeFilters = [
    { value: 'all', label: 'All', icon: Menu },
    { value: 'movie', label: 'Movies', icon: Film },
    { value: 'tv', label: 'TV Shows', icon: Tv2 },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error('Failed to fetch search results');
      const data = await res.json();
      const enhancedResults = await Promise.all(
        data.results
          .filter((item) => item.media_type !== 'person') // Exclude persons
          .map(async (item) => {
            try {
              const externalRes = await fetch(
                `https://api.themoviedb.org/3/${item.media_type}/${item.id}/external_ids?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
              );
              const externalData = await externalRes.json();
              return {
                ...item,
                imdb_id: externalData.imdb_id || null,
                poster: item.poster_path || null,
                release_date: item.release_date || item.first_air_date || null,
                title: item.title || item.name || 'Untitled',
                media_type: item.media_type || (item.title ? 'movie' : 'tv'),
              };
            } catch (error) {
              console.error(`Error fetching external IDs for ${item.id}:`, error);
              return item;
            }
          })
      );
      const filteredResults = enhancedResults.filter(
        (item) => mediaFilter === 'all' || item.media_type === mediaFilter
      );
      setResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to search. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSuggestion = (term) => {
    setQuery(term);
  };

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, [query, mediaFilter]);

  const handleAddToWatchlist = async (updatedItem) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(updatedItem.id),
          title: updatedItem.title || updatedItem.name || 'Untitled',
          overview: updatedItem.overview || null,
          poster: updatedItem.poster || updatedItem.poster_path || null,
          release_date: updatedItem.release_date || updatedItem.first_air_date || null,
          media_type: updatedItem.media_type || 'movie',
          status: updatedItem.status || 'to_watch',
          platform: updatedItem.platform || null,
          notes: updatedItem.notes || null,
          watched_date: updatedItem.watched_date || null,
          imdb_id: updatedItem.imdb_id || null,
        }),
      });
      const newItem = await res.json();
      if (!res.ok) {
        throw new Error(newItem.error || 'Failed to add to watchlist');
      }
      addToast({
        id: Date.now(),
        title: 'Success!',
        description: `${updatedItem.title || 'Item'} added to watchlist`,
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: `Failed to add to watchlist: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Search Movies & TV Shows to get started</h1>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="mb-6 flex justify-center">
          <div className="flex gap-2 w-full max-w-[600px]">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies or TV shows..."
              className="bg-gray-800 text-white border-gray-700 focus:ring-[#E50914] focus:border-[#E50914] flex-1"
            />
            <Button
              type="submit"
              className="bg-[#E50914] hover:bg-[#f6121d] transition-colors"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </form>
        <div className="mb-4 flex justify-center">
          <div className="flex gap-2">
            {mediaTypeFilters.map((filter) => (
              <Button
                key={filter.value}
                onClick={() => setMediaFilter(filter.value)}
                className={`flex items-center gap-1 ${
                  mediaFilter === filter.value
                    ? 'bg-[#E50914] hover:bg-[#f6121d]'
                    : 'bg-gray-700 hover:bg-gray-600'
                } transition-colors`}
              >
                <filter.icon className="h-4 w-4" />
                {filter.label} ({results.filter((item) => filter.value === 'all' ? true : item.media_type === filter.value).length})
              </Button>
            ))}
          </div>
        </div>
        {results.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {results.length} Results for "{query}"
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="relative bg-gray-800 rounded-lg overflow-hidden aspect-[2/3] group"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster || '/placeholder.jpg'}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end sm:flex-row sm:items-end sm:space-x-2 sm:mt-2 sm:space-y-0 space-y-2 sm:opacity-0 sm:group-hover:opacity-100">
                    <div className="hidden sm:flex sm:flex-row sm:space-x-2 w-full">
                      {item.imdb_id ? (
                        <a
                          href={`https://www.imdb.com/title/${item.imdb_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-500 flex items-center gap-1 text-xs rounded-full py-1 px-3 bg-gray-900 hover:bg-gray-800 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          IMDb
                        </a>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1 text-xs rounded-full py-1 px-3 bg-gray-900">
                          <ExternalLink className="h-3 w-3" />
                          IMDb (N/A)
                        </span>
                      )}
                      <Button
                        onClick={() => setSelectedItem(item)}
                        className="text-xs rounded-full py-1 px-3 bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                      >
                        Details
                      </Button>
                      <Button
                        onClick={() => setItemToAdd(item)}
                        className="text-xs rounded-full py-1 px-3 bg-[#E50914] text-white hover:bg-[#f6121d] flex-grow transition-colors"
                      >
                        Add to Watchlist
                      </Button>
                    </div>
                    <div className="flex flex-col space-y-2 sm:hidden w-full">
                      <Button
                        onClick={() => setItemToAdd(item)}
                        className="text-sm rounded-lg py-2 px-3 bg-[#E50914] text-white hover:bg-[#f6121d] transition-colors"
                      >
                        Add to Watchlist
                      </Button>
                      <div className="flex space-x-2">
                        {item.imdb_id ? (
                          <a
                            href={`https://www.imdb.com/title/${item.imdb_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-500 flex items-center gap-1 text-sm rounded-lg py-2 px-3 bg-gray-900 hover:bg-gray-800 transition-colors flex-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            IMDb
                          </a>
                        ) : (
                          <span className="text-gray-500 flex items-center gap-1 text-sm rounded-lg py-2 px-3 bg-gray-900 flex-1">
                            <ExternalLink className="h-4 w-4" />
                            IMDb (N/A)
                          </span>
                        )}
                        <Button
                          onClick={() => setSelectedItem(item)}
                          className="text-sm rounded-lg py-2 px-3 bg-gray-700 text-white hover:bg-gray-600 transition-colors flex-1"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setItemToAdd(item)}
                    className="absolute bottom-3 right-3 sm:hidden bg-[#E50914] text-white rounded-full h-10 w-10 flex items-center justify-center hover:bg-[#f6121d] transition-colors"
                  >
                    <Film className="h-6 w-6" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto bg-[#292929] rounded-lg p-4">
              <Film className="h-8 w-8 mx-auto mb-3 text-[#E50914]" />
              <p className="text-gray-300 mb-4">
                Enter a movie or TV show title in the search box to begin exploring
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Button
                  onClick={() => handleSuggestion('Marvel')}
                  className="bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Try "Marvel"
                </Button>
                <Button
                  onClick={() => handleSuggestion('Star Wars')}
                  className="bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Try "Star Wars"
                </Button>
                <Button
                  onClick={() => handleSuggestion('Breaking Bad')}
                  className="bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Try "Breaking Bad"
                </Button>
                <Button
                  onClick={() => handleSuggestion('Stranger Things')}
                  className="bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Try "Stranger Things"
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToWatchlist={() => {
            setItemToAdd(selectedItem);
            setSelectedItem(null);
          }}
        />
      )}
      {itemToAdd && (
        <AddToWatchlistModal
          item={itemToAdd}
          onSave={handleAddToWatchlist}
          onClose={() => setItemToAdd(null)}
        />
      )}
    </div>
  );
}