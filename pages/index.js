'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DetailsModal from '../components/DetailsModal';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { PlusCircle, Info, ExternalLink, Star, Clock, Film, Tv } from 'lucide-react';
import { useToast, useWatchlist } from '../components/ToastContext';

// Client-side cache for TMDB requests
const tmdbCache = new Map();

function MovieCard({ movie, onAddToWatchlist, onShowDetails }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imdbId, setImdbId] = useState(null);
  const { watchlist, addToast } = useWatchlist();
  const isInWatchlist = Array.isArray(watchlist) && watchlist.some((item) => 
    item.movie_id === movie.id.toString()
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchImdbId = async () => {
      try {
        const endpoint = movie.media_type === 'movie'
          ? `https://api.themoviedb.org/3/movie/${movie.id}/external_ids`
          : `https://api.themoviedb.org/3/tv/${movie.id}/external_ids`;
        const cacheKey = `${endpoint}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`;
        if (tmdbCache.has(cacheKey)) {
          setImdbId(tmdbCache.get(cacheKey).imdb_id || null);
          return;
        }
        const res = await fetch(`${endpoint}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
        if (!res.ok) throw new Error('Failed to fetch IMDb ID');
        const data = await res.json();
        tmdbCache.set(cacheKey, data);
        setImdbId(data.imdb_id || null);
      } catch (error) {
        console.error(`Failed to fetch IMDb ID for ${movie.id}:`, error);
        addToast({
          id: Date.now(),
          title: 'Error',
          description: 'Failed to fetch IMDb ID.',
          variant: 'destructive',
        });
      }
    };
    fetchImdbId();
  }, [movie.id, movie.media_type, addToast]);

  const handleTap = () => {
    if (isMobile) {
      if (!showInfo) {
        setShowInfo(true);
      } else {
        onShowDetails(movie);
      }
    } else {
      onShowDetails(movie);
    }
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
  const displayInfo = movie.release_date || movie.first_air_date
    ? `${(movie.release_date || movie.first_air_date).split('-')[0]} • ${movie.genres || 'N/A'}`
    : 'N/A';
  const voteAverage = typeof movie.vote_average === 'number' && !isNaN(movie.vote_average) 
    ? movie.vote_average.toFixed(1) 
    : parseFloat(movie.vote_average) && !isNaN(parseFloat(movie.vote_average))
    ? parseFloat(movie.vote_average).toFixed(1)
    : 'N/A';
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : movie.episode_run_time && movie.episode_run_time[0]
    ? `${movie.episode_run_time[0]}m`
    : 'N/A';
  const seasons = movie.media_type === 'tv' ? (movie.number_of_seasons || 'N/A') : null;
  const episodes = movie.media_type === 'tv' ? (movie.number_of_episodes || 'N/A') : null;
  const imdbUrl = imdbId
    ? `https://www.imdb.com/title/${imdbId}`
    : `https://www.imdb.com/find/?q=${encodeURIComponent(title)}&s=tt`;

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
      {isMobile && !showInfo && !isInWatchlist && (
        <div className="absolute bottom-2 right-2 z-10">
          <button
            type="button"
            className="bg-[#E50914] text-white rounded-full p-2 shadow-lg touch-manipulation"
            onClick={handleAddClick}
            aria-label="Add to watchlist"
            disabled={isInWatchlist}
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
          <span>
            {movie.media_type === 'tv'
              ? `${seasons} season${seasons !== 1 ? 's' : ''}, ${episodes} episode${episodes !== 1 ? 's' : ''}`
              : runtime}
          </span>
        </div>
        <div className="flex items-center mt-1">
          <span className="text-[#F5C518] font-bold text-xs sm:text-sm">{voteAverage}</span>
          <Star className="h-3 sm:h-4 w-4 text-[#F5C518] fill-current ml-1" />
        </div>
        {isMobile ? (
          <div className="flex flex-col mt-3 space-y-2">
            {!isInWatchlist && (
              <Button
                onClick={handleAddClick}
                className="bg-[#E50914] text-white text-sm font-medium rounded-lg py-2 px-3 hover:bg-red-700 transition flex items-center justify-center"
                disabled={isInWatchlist}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add to Watchlist
              </Button>
            )}
            <div className="flex space-x-2">
              <Button
                onClick={(e) => { e.stopPropagation(); onShowDetails(movie); }}
                className="bg-gray-700 text-white text-sm rounded-lg py-2 flex-1 hover:bg-gray-600 transition flex items-center justify-center max-w-[50%]"
              >
                <Info className="h-4 w-4 mr-1" />
                Details
              </Button>
              <Button
                asChild
                className="bg-[#F5C518] text-black text-sm rounded-lg py-2 flex-1 hover:bg-yellow-400 transition flex items-center justify-center max-w-[50%]"
                disabled={!imdbId}
              >
                <a href={imdbUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  IMDb
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex mt-2 space-x-2 flex-wrap gap-y-2">
            <Button
              onClick={(e) => { e.stopPropagation(); onShowDetails(movie); }}
              className="bg-gray-700 text-white text-xs rounded-full py-1 px-3 hover:bg-gray-600 transition-colors min-w-[80px]"
            >
              <Info className="h-3 w-3 mr-1" />
              Details
            </Button>
            <Button
              asChild
              className="bg-[#F5C518] text-black text-xs rounded-full py-1 px-3 hover:bg-yellow-400 transition flex items-center min-w-[80px]"
              disabled={!imdbId}
            >
              <a href={imdbUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                IMDb
              </a>
            </Button>
            {!isInWatchlist && (
              <Button
                onClick={handleAddClick}
                className="bg-[#E50914] text-white text-xs rounded-full py-1 px-3 hover:bg-red-700 transition-colors flex-grow min-w-[120px]"
                disabled={isInWatchlist}
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                Add to Watchlist
              </Button>
            )}
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
  const { watchlist, mutate: mutateWatchlist, error: watchlistError } = useWatchlist();

  const movieCount = searchResults.filter(item => item.media_type === 'movie').length;
  const tvCount = searchResults.filter(item => item.media_type === 'tv').length;
  const allCount = searchResults.length;

  const fetchTmdb = async (url) => {
    if (tmdbCache.has(url)) {
      console.log(`Cache hit for TMDB: ${url}`);
      return tmdbCache.get(url);
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch TMDB: ${res.statusText}`);
    const data = await res.json();
    tmdbCache.set(url, data);
    return data;
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
      console.log(`Fetching TMDB URL: ${searchUrl}`);
      const searchData = await fetchTmdb(searchUrl);
      console.log(`Raw TMDB response for "${query}" (page 1):`, searchData.results);
      const filteredResults = searchData.results.filter(
        (item) => item.media_type === 'movie' || item.media_type === 'tv'
      );

      const enhancedResults = await Promise.all(
        filteredResults.map(async (item) => {
          try {
            const detailUrl = `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=external_ids`;
            const details = await fetchTmdb(detailUrl);
            return {
              ...item,
              imdb_id: details.external_ids?.imdb_id || null,
              vote_average: details.vote_average ? parseFloat(details.vote_average) : null,
              runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]) || null,
              genres: details.genres?.map((g) => g.name).join(', ') || 'N/A',
              release_date: item.media_type === 'movie' ? details.release_date || item.release_date : null,
              first_air_date: item.media_type === 'tv' ? details.first_air_date || item.first_air_date : null,
              number_of_seasons: item.media_type === 'tv' ? details.number_of_seasons || null : null,
              number_of_episodes: item.media_type === 'tv' ? details.number_of_episodes || null : null,
            };
          } catch (error) {
            console.warn(`Failed to fetch details for ${item.id}:`, error);
            return {
              ...item,
              genres: 'N/A',
              runtime: null,
              imdb_id: null,
            };
          }
        })
      );

      const sortedResults = enhancedResults.sort((a, b) => {
        const aTitle = (a.title || a.name || '').toLowerCase();
        const bTitle = (b.title || b.name || '').toLowerCase();
        const queryLower = query.toLowerCase();

        if (aTitle === queryLower && bTitle !== queryLower) return -1;
        if (bTitle === queryLower && aTitle !== queryLower) return 1;
        if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
        if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1;
        if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
        if (bTitle.includes(queryLower) && !aTitle.includes(queryLower)) return 1;
        return (b.popularity || 0) - (a.popularity || 0);
      });

      setSearchResults(sortedResults);
      console.log(`Search query "${query}" page 1 returned ${sortedResults.length} results, total: ${searchData.total_results}, pages: ${searchData.total_pages}`);
    } catch (error) {
      console.error('Search error:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to fetch search results. Please try again.',
        variant: 'destructive',
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToWatchlist = async (payload) => {
    try {
      if (!payload.movie_id || !payload.title || !payload.user_id) {
        throw new Error('movie_id, title, and user_id are required');
      }
      const response = await fetch('/api/watchlist', {
        method: payload.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save to watchlist');
      }
      await mutateWatchlist(async (currentWatchlist) => {
        const updatedWatchlist = Array.isArray(currentWatchlist) ? [...currentWatchlist] : [];
        if (payload.id) {
          const index = updatedWatchlist.findIndex((item) => item.id === payload.id);
          if (index !== -1) {
            updatedWatchlist[index] = { ...updatedWatchlist[index], ...payload };
          }
        } else {
          updatedWatchlist.push({ ...payload, id: Date.now().toString() });
        }
        return updatedWatchlist;
      }, { revalidate: true });
      addToast({
        id: Date.now(),
        title: 'Success',
        description: 'Added to watchlist',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving to watchlist:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: error.message || 'Failed to update watchlist',
        variant: 'destructive',
      });
    }
  };

  const handleAddToWatchlist = (item) => {
    const watchlistEntry = watchlist.find((w) => w.movie_id === item.id.toString());
    setWatchlistItem({
      ...item,
      watchlistId: watchlistEntry?.id,
      status: watchlistEntry?.status || 'to_watch',
      platform: watchlistEntry?.platform || null,
      watched_date: watchlistEntry?.watched_date || null,
      notes: watchlistEntry?.notes || null,
      movie_id: item.id.toString(),
      user_id: 1, // Adjust based on your auth system
    });
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => handleSearch(searchQuery), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [mediaFilter]);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Search Movies & TV Shows</h1>
        <div className="flex flex-col items-center gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search for a movie or TV show..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-2xl bg-[#1a1a1a] border-gray-600 text-white"
          />
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setMediaFilter('all')}
              className={`${
                mediaFilter === 'all' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'
              } text-white flex items-center gap-1`}
            >
              <Film className="h-4 w-4" />
              All ({allCount})
            </Button>
            <Button
              onClick={() => setMediaFilter('movie')}
              className={`${
                mediaFilter === 'movie' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'
              } text-white flex items-center gap-1`}
            >
              <Film className="h-4 w-4" />
              Movies ({movieCount})
            </Button>
            <Button
              onClick={() => setMediaFilter('tv')}
              className={`${
                mediaFilter === 'tv' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'
              } text-white flex items-center gap-1`}
            >
              <Tv className="h-4 w-4" />
              Shows ({tvCount})
            </Button>
          </div>
        </div>
        {searchQuery.toLowerCase().includes('mad') && !searchQuery.toLowerCase().includes('mad max') && searchResults.length > 0 && !searchResults.some((item) => (item.title || item.name)?.toLowerCase().includes('mad max')) && (
          <p className="text-gray-300 mb-4 text-center">
            No Mad Max titles found. Try searching “Mad Max” for the franchise.
          </p>
        )}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] w-full bg-gray-800 rounded-lg" />
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
                  Star Wars
                </Button>
                <Button onClick={() => { setSearchQuery("Breaking Bad"); handleSearch("Breaking Bad"); }}>
                  Try "Breaking Bad"
                </Button>
                <Button onClick={() => { setSearchQuery("Stranger Things"); handleSearch("Stranger Things"); }}>
                  Stranger Things
                </Button>
              </div>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300">No results found. Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {searchResults
              .filter((item) => mediaFilter === 'all' || item.media_type === mediaFilter)
              .map((item) => (
                <MovieCard
                  key={item.id}
                  movie={item}
                  onAddToWatchlist={() => handleAddToWatchlist(item)}
                  onShowDetails={() => setSelectedItem(item)}
                />
              ))}
          </div>
        )}
      </main>
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