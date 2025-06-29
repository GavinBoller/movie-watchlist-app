'use client';

import { useState, useEffect, useMemo } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import DetailsModal from '../components/DetailsModal';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { PlusCircle, Info, ExternalLink, Star, Clock, Film, Tv, List, X } from 'lucide-react'; 
import { useToast, useWatchlist, WatchlistProvider } from '../components/ToastContext';
import { useSWRConfig } from 'swr';

function MovieCard({ movie, onAddToWatchlist, onShowDetails }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { watchlist } = useWatchlist();
  const isInWatchlist = Array.isArray(watchlist) && watchlist.some((item) => 
    item.movie_id === movie.id.toString() || item.movie_id === movie.id
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTap = () => {
    if (isMobile) {
      if (!showInfo) {
        setShowInfo(true);
      } else {
        onShowDetails(movie); // Open modal on second tap
      }
    } else {
      onShowDetails(movie); // Open modal on click for desktop
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
      <div // This is the movie-info div that appears on hover/tap
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
              ? `${seasons} seasons, ${episodes} episodes`
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
            <div className="flex flex-wrap gap-2"> {/* Changed to flex-wrap gap-2 */}
              <Button
                onClick={(e) => { e.stopPropagation(); onShowDetails(movie); }}
                className="bg-gray-700 text-white text-sm rounded-lg py-2 w-full sm:w-auto flex items-center justify-center"
              >
                <Info className="h-4 w-4 mr-1" />
                Details
              </Button>
              {movie.imdb_id && (
                <Button
                  asChild
                  className="bg-[#F5C518] text-black text-sm rounded-lg py-2 w-full sm:w-auto hover:bg-yellow-400 transition flex items-center justify-center"
                >
                  <a
                    href={`https://www.imdb.com/title/${movie.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => { e.stopPropagation(); onShowDetails(movie); }}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  IMDb
                </a>
              </Button>
            )}
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
  const [selectedGenreId, setSelectedGenreId] = useState('all'); // Stores TMDB genre ID
  const [genres, setGenres] = useState([]); // Stores fetched genre list
  const [minRating, setMinRating] = useState('0'); // Stores minimum rating (e.g., '6', '7')
  const [discoveryMode, setDiscoveryMode] = useState('text'); // 'text', 'top_rated', 'popular', 'latest'
  const [excludeWatchlist, setExcludeWatchlist] = useState(false);
  const [sortOrder, setSortOrder] = useState('popularity.desc'); // Default TMDB sort
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const SEARCH_LIMIT = 40;
  const { mutate } = useSWRConfig();
  const { watchlist, isLoading: isWatchlistLoading, mutate: mutateWatchlist, error: watchlistError } = useWatchlist();

  // Determine if the item selected for the modal is in the watchlist
  const selectedItemIsInWatchlist = useMemo(() => {
    if (!selectedItem || !Array.isArray(watchlist)) {
      return false;
    }
    return watchlist.some((item) => String(item.movie_id) === String(selectedItem.id));
  }, [selectedItem, watchlist]);
  
  // State for filter counts from API
  const [totalAllCount, setTotalAllCount] = useState(0); 
  const [movieCount, setMovieCount] = useState(0);
  const [tvCount, setTvCount] = useState(0);

  const handleSearch = async (query) => {
    // Don't search if in text mode and there's no query and no filters are selected
    // For discovery modes, always search even if query is empty.
    if (discoveryMode === 'text' && !query.trim() && selectedGenreId === 'all' && minRating === '0') {
      setSearchResults([]);
      // Reset counts when no search or filters
      // Only reset if it's truly an empty state, not just changing mode
      // If changing mode, counts will be updated by the new API call
      if (discoveryMode === 'text') setTotalAllCount(0);
      setMovieCount(0);
      setTvCount(0);
      return;
    }
    setIsLoading(true);
    try {
      const searchTerm = discoveryMode === 'text' ? query.trim() : ''; // Only send query if in text mode
      const apiRes = await fetch(
        `/api/search?query=${encodeURIComponent(searchTerm)}&media_type=${mediaFilter}&genre_id=${selectedGenreId}&min_rating=${minRating}&sort_by=${sortOrder}&page=${page}&limit=${SEARCH_LIMIT}&discovery_mode=${discoveryMode}`
      );
      if (!apiRes.ok) throw new Error('Failed to fetch search results from API');
      const apiData = await apiRes.json();
      let filteredResults = apiData.data || [];

      if (excludeWatchlist) {
        // Ensure all IDs are strings for consistent comparison
        const watchlistMovieIds = new Set(watchlist.map(wItem => String(wItem.movie_id)));
        filteredResults = filteredResults.filter(item => {
          // Ensure item.id is a string for comparison with Set entries
          return !watchlistMovieIds.has(String(item.id));
        });
      }

      // All filtering and sorting is now handled by the backend API.
      setSearchResults(filteredResults);
      setTotalPages(Math.ceil((apiData.total || 0) / SEARCH_LIMIT));
      // Update counts from API response
      setTotalAllCount(apiData.counts?.all || 0);
      setMovieCount(apiData.counts?.movie || 0);
      setTvCount(apiData.counts?.tv || 0);
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
    const isInWatchlist = watchlist.some((wItem) => 
      wItem.movie_id === item.id.toString() || wItem.movie_id === item.id
    );
    if (isInWatchlist) {
      addToast({
        id: Date.now(),
        title: 'Info',
        description: `${item.title || item.name} is already in your watchlist`,
      });
      return;
    }
    setWatchlistItem({ ...item, media_type: item.media_type || 'movie', poster_path: item.poster_path });
  };

  const handleShowDetails = (item) => {
    // Normalize the item from TMDB to match the structure DetailsModal expects,
    // which is similar to our database schema (e.g., using 'poster' instead of 'poster_path').
    setSelectedItem({ 
      ...item, 
      poster: item.poster_path, // Map poster_path to poster
      media_type: item.media_type || 'movie' });
  };

  const handleSaveNewItemSuccess = async (savedItem) => {
    // Revalidate any SWR key that starts with /api/watchlist to ensure
    // the watchlist page gets the latest data.
    mutate((key) => typeof key === 'string' && key.startsWith('/api/watchlist'), undefined, { revalidate: true });
  };

  // Fetch genres on component mount
  useEffect(() => {
    async function fetchGenres() {
      try {
        const res = await fetch('/api/genres');
        if (!res.ok) throw new Error('Failed to fetch genres');
        const data = await res.json();
        setGenres(data);
      } catch (error) {
        console.error('Error fetching genres:', error);
        addToast({ id: Date.now(), title: 'Error', description: 'Failed to load genres', variant: 'destructive' });
      }
    }
    fetchGenres();
  }, []);

  useEffect(() => {
    // Clear search query when switching from text mode to a discovery mode
    if (discoveryMode !== 'text' && searchQuery !== '') {
      setSearchQuery('');
      // The useEffect below will handle triggering handleSearch with the new discoveryMode
      return; 
    }

    // Debounce for text search, immediate for discovery mode changes
    const delay = discoveryMode === 'text' ? 500 : 0;
    const timeoutId = setTimeout(() => handleSearch(searchQuery), delay);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, mediaFilter, selectedGenreId, minRating, sortOrder, page, excludeWatchlist, discoveryMode]);
  
  // This effect resets the page to 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [searchQuery, mediaFilter, selectedGenreId, minRating, sortOrder, excludeWatchlist, discoveryMode]);


  if (watchlistError) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header />
        <div className="container mx-auto p-4 text-center">
          <p className="text-gray-300">Failed to load watchlist: {watchlistError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Search Movies & TV Shows</h1>

        {/* Discovery Mode Buttons */}
        <div className="mb-6 flex justify-center gap-2 flex-wrap">
          <Button
            onClick={() => setDiscoveryMode('text')}
            className={`flex items-center gap-1 ${discoveryMode === 'text' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Title Search
          </Button>
          <Button
            onClick={() => setDiscoveryMode('top_rated')}
            className={`flex items-center gap-1 ${discoveryMode === 'top_rated' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Top Rated
          </Button>
          <Button
            onClick={() => setDiscoveryMode('popular')}
            className={`flex items-center gap-1 ${discoveryMode === 'popular' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Popular
          </Button>
          <Button
            onClick={() => setDiscoveryMode('latest')}
            className={`flex items-center gap-1 ${discoveryMode === 'latest' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Latest Releases
          </Button>
        </div>

        {/* Search Input Field (only visible/active in text search mode) */}
        {discoveryMode === 'text' && (
          <div className="mb-4 flex justify-center">
            <div className="relative w-full sm:max-w-md md:max-w-lg">
              <Input
                type="text"
                placeholder="Search for movies or TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-gray-800 border-gray-700 text-white rounded-full py-2 pl-4 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="mb-4 flex justify-center gap-2">
          <Button onClick={() => setMediaFilter('all')} className={`flex items-center gap-1 ${mediaFilter === 'all' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <List className="h-4 w-4" /> All ({totalAllCount})
          </Button>
          <Button onClick={() => setMediaFilter('movie')} className={`flex items-center gap-1 ${mediaFilter === 'movie' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <Film className="h-4 w-4" /> Movies ({movieCount})
          </Button>
          <Button onClick={() => setMediaFilter('tv')} className={`flex items-center gap-1 ${mediaFilter === 'tv' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <Tv className="h-4 w-4" /> TV Shows ({tvCount})
          </Button>
        </div>
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {/* Genre Filter */}
          <Select onValueChange={setSelectedGenreId} value={selectedGenreId}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select Genre" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.id} value={genre.id.toString()}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Minimum Rating Filter */}
          <Select onValueChange={setMinRating} value={minRating}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Min Rating" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="6">6+</SelectItem>
              <SelectItem value="7">7+</SelectItem>
              <SelectItem value="8">8+</SelectItem>
              <SelectItem value="9">9+</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By Filter */}
          <Select onValueChange={setSortOrder} value={sortOrder}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="popularity.desc">Relevance</SelectItem>
              <SelectItem value="release_date.desc">Release Date (Newest)</SelectItem>
              <SelectItem value="release_date.asc">Release Date (Oldest)</SelectItem>
              <SelectItem value="title.asc">Title (A-Z)</SelectItem>
              <SelectItem value="title.desc">Title (Z-A)</SelectItem>
              <SelectItem value="vote_average.desc">Rating (High-Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exclude-watchlist"
              checked={excludeWatchlist}
              disabled={isWatchlistLoading} // Disable if watchlist data is still loading
              onCheckedChange={setExcludeWatchlist}
              className="border-gray-700 data-[state=checked]:bg-[#E50914] data-[state=checked]:text-white"
            />
            <label
              htmlFor="exclude-watchlist"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Exclude items already in my watchlist
            </label>
          </div>
        </div>

        {searchQuery.toLowerCase().includes('mad') && !searchQuery.toLowerCase().includes('mad max') && searchResults.length > 0 && !searchResults.some((item) => (item.title || item.name)?.toLowerCase().includes('mad max')) && (
          <p className="text-gray-300 mb-4 text-center">
            No Mad Max titles found. Try searching “Mad Max” for the franchise.
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="w-full aspect-[2/3]" />
              </div>
            ))}
          </div>
        ) : discoveryMode === 'text' && !searchQuery && searchResults.length === 0 ? (
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
        ) : (
          searchResults.length === 0 ? (
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
        )
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-4">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isLoading}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Previous
            </Button>
            <span className="text-gray-300 font-medium">
              Page {page} of {totalPages}
            </span>
            <Button onClick={() => setPage(page + 1)} disabled={page >= totalPages || isLoading} className="bg-gray-700 hover:bg-gray-600">
              Next
            </Button>
          </div>
        )}
        </div>
      </main>
      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToWatchlist={() => handleAddToWatchlist(selectedItem)}
          isInWatchlist={selectedItemIsInWatchlist}
        />
      )}
      {watchlistItem && (
        <AddToWatchlistModal
          item={watchlistItem}
          mode="add"
          onClose={() => setWatchlistItem(null)}
          onSaveSuccess={handleSaveNewItemSuccess}
        />
      )}
      <Footer />
    </div>
  );
}
