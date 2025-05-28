'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DetailsModal from '../components/DetailsModal';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { PlusCircle, Info, ExternalLink, Star, Clock, Film, Tv, List } from 'lucide-react';
import { useToast } from '../components/ToastContext';

function MovieCard({ movie, onAddToWatchlist, onShowDetails }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTap = () => {
    if (isMobile) setShowInfo(!showInfo);
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    onAddToWatchlist();
  };

  const title = movie.title || movie.name || 'Unknown';
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : 'https://placehold.co/300x450?text=No+Image';
  const badgeClass = movie.media_type === 'tv' ? 'bg-blue-600' : 'bg-[#E50914]';
  const typeBadge = movie.media_type === 'tv' ? 'TV' : 'Movie';
  const displayInfo = movie.release_date
    ? `${movie.release_date.split('-')[0]} • ${movie.genres || 'N/A'}`
    : 'N/A';
  const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : movie.episode_run_time && movie.episode_run_time[0]
    ? `${movie.episode_run_time[0]}m`
    : 'N/A';

  return (
    <div
      className="movie-card relative rounded-lg overflow-hidden group cursor-pointer touch-manipulation"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={handleTap}
      data-testid={`movie-${movie.id}`}
    >
      <img
        src={posterUrl}
        alt={title}
        className="w-full aspect-[2/3] object-cover"
        loading="lazy"
      />
      <div
        className={`absolute top-2 right-2 ${badgeClass} text-white text-xs font-bold py-1 px-2 rounded-full`}
      >
        {typeBadge}
      </div>
      {isMobile && !showInfo && (
        <div className="absolute bottom-2 right-2 z-10">
          <button
            type="button"
            className="bg-[#E50914] text-white rounded-full p-2 shadow-lg touch-manipulation"
            onClick={handleAddClick}
            aria-label="Add to watchlist"
          >
            <PlusCircle className="h-6 w-6" />
          </button>
        </div>
      )}
      <div
        className={`movie-info absolute inset-0 bg-black bg-opacity-85 flex flex-col justify-end p-4 mx-2 transition-opacity duration-300 ${
          isMobile ? (showInfo ? 'opacity-100' : 'opacity-0') : isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h3 className="font-bold text-sm sm:text-base md:text-lg">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-300">{displayInfo}</p>
        <div className="flex items-center text-xs text-gray-400 mt-1">
          <Clock className="h-3 w-3 mr-1" />
          <span>{runtime}</span>
        </div>
        <div className="flex items-center mt-1">
          <span className="text-[#F5C518] font-bold text-xs sm:text-sm">{voteAverage}</span>
          <Star className="h-3 sm:h-4 w-4 text-[#F5C518] fill-current ml-1" />
        </div>
        {isMobile ? (
          <div className="flex flex-col mt-3 space-y-2">
            <Button
              onClick={handleAddClick}
              className="bg-[#E50914] text-white text-sm font-medium rounded-lg py-2 px-3 hover:bg-red-700 transition flex items-center justify-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add to Watchlist
            </Button>
            <div className="flex space-x-2">
              <Button
                onClick={() => onShowDetails(movie)}
                className="bg-gray-700 text-white text-sm rounded-lg py-2 flex-1 hover:bg-gray-600 transition flex items-center justify-center max-w-[50%]"
              >
                <Info className="h-4 w-4 mr-1" />
                Details
              </Button>
              {movie.imdb_id && (
                <Button
                  asChild
                  className="bg-[#F5C518] text-black text-sm rounded-lg py-2 flex-1 hover:bg-yellow-400 transition flex items-center justify-center max-w-[50%]"
                >
                  <a
                    href={`https://www.imdb.com/title/${movie.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    IMDb
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex mt-2 space-x-2 flex-wrap gap-y-2">
            <Button
              onClick={() => onShowDetails(movie)}
              className="bg-gray-700 text-white text-xs rounded-full py-1 px-3 hover:bg-gray-600 transition-colors min-w-[80px]"
            >
              <Info className="h-3 w-3 mr-1" />
              Details
            </Button>
            {movie.imdb_id && (
              <Button
                asChild
                className="bg-[#F5C518] text-black text-xs rounded-full py-1 px-3 hover:bg-yellow-400 transition flex items-center min-w-[80px]"
              >
                <a
                  href={`https://www.imdb.com/title/${movie.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  IMDb
                </a>
              </Button>
            )}
            <Button
              onClick={handleAddClick}
              className="bg-[#E50914] text-white text-xs rounded-full py-1 px-3 hover:bg-red-700 transition-colors flex-grow min-w-[120px]"
            >
              <PlusCircle className="h-3 w-3 mr-1" />
              Add to Watchlist
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [watchlistItem, setWatchlistItem] = useState(null);
  const [mediaFilter, setMediaFilter] = useState('all');
  const { addToast } = useToast();

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error('Failed to fetch search results');
      const data = await res.json();
      console.log(`Search query "${query}" returned ${data.results.length} results`);
      const enhancedResults = await Promise.all(
        data.results.map(async (item) => {
          if (item.media_type !== 'movie' && item.media_type !== 'tv') return null;
          try {
            const detailsRes = await fetch(
              `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=external_ids`
            );
            const details = await detailsRes.json();
            console.log(`Item ${item.id} external_ids:`, JSON.stringify(details.external_ids));
            return {
              ...item,
              imdb_id: details.external_ids?.imdb_id || null,
              vote_average: details.vote_average || item.vote_average || null,
              runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]) || null,
              genres: details.genres?.map((g) => g.name).join(', ') || 'N/A',
            };
          } catch (error) {
            console.warn(`Failed to fetch details for ${item.id}:`, error);
            return item;
          }
        })
      );
      const filteredResults = enhancedResults
        .filter((item) => item && (item.media_type === 'movie' || item.media_type === 'tv'))
        .filter((item) => mediaFilter === 'all' || item.media_type === mediaFilter);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to load search results',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWatchlist = (item) => {
    setWatchlistItem({ ...item, media_type: item.media_type || 'movie' });
  };

  const handleShowDetails = (item) => {
    setSelectedItem({ ...item, media_type: item.media_type || 'movie' });
  };

  const handleSaveToWatchlist = async (item) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster: item.poster_path,
          release_date: item.release_date || item.first_air_date,
          media_type: item.media_type,
          status: item.status,
          platform: item.platform,
          notes: item.notes,
          imdb_id: item.imdb_id,
          vote_average: item.vote_average,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add to watchlist');
      }
      addToast({
        id: Date.now(),
        title: 'Success',
        description: 'Added to watchlist',
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: error.message || 'Failed to add to watchlist',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => handleSearch(searchQuery), 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [mediaFilter]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Search Movies & TV Shows</h1>
        <div className="mb-4 flex justify-center">
          <Input
            type="text"
            placeholder="Search for movies or TV shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-[50%] bg-gray-800 border-gray-700 text-white rounded-full py-2 px-4"
          />
        </div>
        <div className="mb-4 flex justify-center gap-2">
          <Button
            onClick={() => setMediaFilter('all')}
            className={`flex items-center gap-1 ${mediaFilter === 'all' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <List className="h-4 w-4" />
            All
          </Button>
          <Button
            onClick={() => setMediaFilter('movie')}
            className={`flex items-center gap-1 ${mediaFilter === 'movie' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Film className="h-4 w-4" />
            Movies
          </Button>
          <Button
            onClick={() => setMediaFilter('tv')}
            className={`flex items-center gap-1 ${mediaFilter === 'tv' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Tv className="h-4 w-4" />
            TV Shows
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="w-full aspect-[2/3]" />
              </div>
            ))}
          </div>
        ) : !searchQuery && searchResults.length === 0 ? (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto bg-[#292929] rounded-lg p-4">
              <Film className="h-8 w-8 mx-auto mb-3 text-[#E50914]" />
              <p className="text-gray-300 mb-4">
                Enter a movie or TV show title in the search box to begin exploring
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Button onClick={() => { setSearchQuery("Marvel"); handleSearch("Marvel"); }}>
                  Try "Marvel"
                </Button>
                <Button onClick={() => { setSearchQuery("Star Wars"); handleSearch("Star Wars"); }}>
                  Try "Star Wars"
                </Button>
                <Button onClick={() => { setSearchQuery("Breaking Bad"); handleSearch("Breaking Bad"); }}>
                  Try "Breaking Bad"
                </Button>
                <Button onClick={() => { setSearchQuery("Stranger Things"); handleSearch("Stranger Things"); }}>
                  Try "Stranger Things"
                </Button>
              </div>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300">No results found. Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {searchResults.map((item) => (
              <MovieCard
                key={item.id}
                movie={item}
                onAddToWatchlist={() => handleAddToWatchlist(item)}
                onShowDetails={handleShowDetails}
              />
            ))}
          </div>
        )}
      </div>
      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToWatchlist={() => handleAddToWatchlist(selectedItem)}
        />
      )}
      {watchlistItem && (
        <AddToWatchlistModal
          item={watchlistItem}
          onSave={handleSaveToWatchlist}
          onClose={() => setWatchlistItem(null)}
        />
      )}
    </div>
  );
}