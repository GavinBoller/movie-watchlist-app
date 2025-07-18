// @ts-nocheck
/* eslint-disable jsx-a11y/aria-props */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import DynamicDetailsModal from '../components/DynamicDetailsModal';
import DynamicAddToWatchlistModal from '../components/DynamicAddToWatchlistModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { PlusCircle, Info, ExternalLink, Star, Clock, Film, Tv, List, X, Edit, AlertCircle } from 'lucide-react'; 
import { useToast, useWatchlist } from '../hooks/useToast';
import { useSWRConfig } from 'swr';
import { useDebouncedSearch } from '../utils/useDebounce';
import { TMDBMovie, WatchlistItem } from '../types';

// Create a simple, reliable checkbox component
function ClientCheckbox({ id, checked, disabled = false, onCheckedChange, className = '' }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className={`h-4 w-4 rounded-sm border border-gray-700 bg-transparent ${className}`}></div>;
  }
  
  const isDisabled = Boolean(disabled);
  
  const handleClick = () => {
    if (!isDisabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };
  
  return (
    <div
      id={id}
      role="checkbox"
      // eslint-disable-next-line jsx-a11y/aria-props
      aria-checked={`${checked}`}
      tabIndex={isDisabled ? -1 : 0}
      className={`
        h-4 w-4 rounded-sm border cursor-pointer inline-flex items-center justify-center
        ${checked 
          ? 'bg-[#E50914] border-[#E50914] text-white' 
          : 'border-gray-400 bg-transparent hover:border-gray-300'
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {checked && (
        <svg
          className="h-3 w-3 text-current"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
}

interface MovieCardProps {
  movie: TMDBMovie;
  onAddToWatchlist: (movie: TMDBMovie | WatchlistItem) => void;
  onShowDetails: (movie: TMDBMovie) => void;
  priority?: boolean; // Add priority prop for image loading
}

const MovieCard = React.memo<MovieCardProps>(({ movie, onAddToWatchlist, onShowDetails, priority = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { watchlist } = useWatchlist();
  
  // Memoize watchlist check for performance
  const isInWatchlist = useMemo(() => 
    Array.isArray(watchlist) && watchlist.some((item) => 
      item.movie_id === movie.id.toString() || item.movie_id === movie.id
    ),
    [watchlist, movie.id]
  );

  // Find the watchlist item if it exists, for editing
  const watchlistItem = useMemo(() => {
    if (!isInWatchlist || !Array.isArray(watchlist)) return null;
    return watchlist.find(item => 
      item.movie_id === movie.id.toString() || item.movie_id === movie.id
    );
  }, [isInWatchlist, watchlist, movie.id]);

  // Use useLayoutEffect instead of useEffect for faster initialization
  useLayoutEffect(() => {
    setIsMounted(true);
    // Check if device supports hover interactions (not touch-only)
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    // Touch device = no hover capability OR no fine pointer (like mouse)
    const isTouch = !hasHover || !hasPointer;
    setIsTouchDevice(isTouch);
    
    // Listen for media query changes
    const hoverQuery = window.matchMedia('(hover: hover)');
    const pointerQuery = window.matchMedia('(pointer: fine)');
    const handleMediaChange = () => {
      const hasHover = window.matchMedia('(hover: hover)').matches;
      const hasPointer = window.matchMedia('(pointer: fine)').matches;
      setIsTouchDevice(!hasHover || !hasPointer);
    };
    
    hoverQuery.addEventListener('change', handleMediaChange);
    pointerQuery.addEventListener('change', handleMediaChange);
    return () => {
      hoverQuery.removeEventListener('change', handleMediaChange);
      pointerQuery.removeEventListener('change', handleMediaChange);
    };
  }, [priority]);

  const handleTap = () => {
    if (!isMounted) {
      // Fallback to desktop behavior during SSR/initial render
      onShowDetails(movie);
      return;
    }
    
    if (isTouchDevice) {
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
    onAddToWatchlist(isInWatchlist ? watchlistItem : movie);
  };

  const title = movie.title || movie.name || 'Unknown';
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : '/placeholder-image.svg';
  const badgeClass = movie.media_type === 'tv' ? 'bg-teal-600' : 'bg-purple-600';
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
      onMouseEnter={() => isMounted && !isTouchDevice && setIsHovered(true)}
      onMouseLeave={() => isMounted && !isTouchDevice && setIsHovered(false)}
      onClick={handleTap}
      data-testid={`movie-${movie.id}`}
    >
      <img
        src={posterUrl}
        alt={title}
        className="w-full aspect-[2/3] object-cover"
        loading={priority ? "eager" : "lazy"}
        width="300"
        height="450"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/placeholder-image.svg';
        }}
      />
      <div
        className={`absolute top-2 right-2 ${badgeClass} text-white text-xs font-bold py-1 px-2 rounded-full z-20`}
      >
        {typeBadge}
      </div>
      
      {/* Show watch status indicator if item is in watchlist */}
      {isInWatchlist && watchlistItem && (
        <div className={`absolute top-2 left-2 z-20 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap capitalize shadow-md ${
          watchlistItem.status === 'watched' ? 'bg-green-800' :
          watchlistItem.status === 'watching' ? 'bg-amber-700' : 'bg-blue-800'
        }`}>
          {(watchlistItem.status || '').replace('_', ' ')}
        </div>
      )}
      
      {/* Show the + or Edit button - always visible on touch devices when not showing info, and on hover devices when not hovering */}
      {(!isMounted || isTouchDevice ? !showInfo : !isHovered) && (
        <div className="absolute bottom-2 right-2 z-30">
          <button
            type="button"
            className={`${isInWatchlist ? 'bg-indigo-700' : 'bg-[#E50914]'} text-white rounded-full p-2 shadow-lg touch-manipulation hover:scale-110 transition-transform`}
            onClick={handleAddClick}
            aria-label={isInWatchlist ? "Edit in watchlist" : "Add to watchlist"}
          >
            {isInWatchlist ? (
              <Edit className="h-6 w-6" />
            ) : (
              <PlusCircle className="h-6 w-6" />
            )}
          </button>
        </div>
      )}
      <div // This is the movie-info div that appears on hover/tap
        className={`movie-info absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-end p-4 transition-opacity duration-150 ${
          !isMounted ? 'opacity-0' : 
          isTouchDevice ? (showInfo ? 'opacity-100' : 'opacity-0') : isHovered ? 'opacity-100' : 'opacity-0'
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
        {isMounted && isTouchDevice ? (
          <div className="flex flex-col mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={(e) => { e.stopPropagation(); onShowDetails(movie); }}
                className="bg-gray-700 text-white text-sm rounded-lg py-2 flex items-center justify-center"
              >
                <Info className="h-4 w-4 mr-1" />
                Details
              </Button>
              {movie.imdb_id && (
                <Button
                  asChild
                  className="bg-[#F5C518] text-black text-sm rounded-lg py-2 hover:bg-yellow-400 transition flex items-center justify-center"
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
            <Button
              onClick={handleAddClick}
              className={`${
                isInWatchlist 
                  ? 'bg-indigo-700 hover:bg-indigo-600' 
                  : 'bg-[#E50914] hover:bg-red-700'
              } text-white text-sm font-medium rounded-lg py-2 px-3 transition flex items-center justify-center`}
            >
              {isInWatchlist ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit in Watchlist
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap mt-2 gap-2">
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
            <Button
              onClick={handleAddClick}
              className={`${
                isInWatchlist 
                  ? 'bg-indigo-700 text-white hover:bg-indigo-600' 
                  : 'bg-[#E50914] text-white hover:bg-red-700'
              } text-xs rounded-full py-1 px-3 transition-colors flex-grow min-w-[120px]`}
            >
              {isInWatchlist ? (
                <>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit in Watchlist
                </>
              ) : (
                <>
                  <PlusCircle className="h-3 w-3 mr-1" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// Only import and render KeyboardShortcutsHelp on desktop devices
const KeyboardShortcutsHelp = dynamic(() => import('../components/KeyboardShortcutsHelp'), {
  ssr: false,
  loading: () => null
});

// Component to conditionally render KeyboardShortcutsHelp only on desktop
function DesktopOnlyKeyboardShortcuts() {
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    // Check if device is desktop (not mobile/tablet)
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);  // Standard desktop breakpoint
    };
    
    // Initial check
    checkIsDesktop();
    
    // Listen for resize events
    window.addEventListener('resize', checkIsDesktop);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);
  
  // Only render on desktop devices
  if (!isDesktop) return null;
  
  return <KeyboardShortcutsHelp />;
}

export default function SearchPage() {
  const { value: searchInput, debouncedValue: searchQuery, onChange: handleSearchChange, setValue: setSearchInput } = useDebouncedSearch('', 500);
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
  const [isMounted, setIsMounted] = useState(false);
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const SEARCH_LIMIT = 40;
  const { mutate } = useSWRConfig();
  const { watchlist, isLoading: isWatchlistLoading, mutate: mutateWatchlist, error: watchlistError } = useWatchlist();

  // State for filter counts from API
  const [totalAllCount, setTotalAllCount] = useState(0); 
  const [movieCount, setMovieCount] = useState(0);
  const [tvCount, setTvCount] = useState(0);

  // Memoize expensive functions with useCallback
  const handleSearch = useCallback(async (query) => {
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
      setTotalPages(Math.ceil((apiData.total || apiData.counts?.all || 0) / SEARCH_LIMIT));
      console.log('API /api/search response:', apiData);
      console.log('Results shown to user (after excludeWatchlist filter):', filteredResults.length);
      // Update counts based on filtered results when excluding watchlist items
      if (excludeWatchlist) {
        // Only update visible counts, not pagination
        const allCount = filteredResults.length;
        const movieCount = filteredResults.filter(item => item.media_type === 'movie').length;
        const tvCount = filteredResults.filter(item => item.media_type === 'tv').length;
        setTotalAllCount(allCount);
        setMovieCount(movieCount);
        setTvCount(tvCount);
      } else {
        setTotalAllCount(apiData.counts?.all || 0);
        setMovieCount(apiData.counts?.movie || 0);
        setTvCount(apiData.counts?.tv || 0);
      }
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
  }, [discoveryMode, selectedGenreId, minRating, mediaFilter, sortOrder, page, SEARCH_LIMIT, excludeWatchlist, watchlist, addToast]);

  const handleAddToWatchlist = useCallback((item) => {
    if (Array.isArray(watchlist) && watchlist.some(w => 
      w.movie_id === item.id.toString() || w.movie_id === item.id)) {
      // Item is already in watchlist - find it for editing
      const existingItem = watchlist.find(w => 
        w.movie_id === item.id.toString() || w.movie_id === item.id);
      setWatchlistItem({...existingItem, mode: 'edit'});
    } else {
      // New item - add to watchlist
      setWatchlistItem(item);
    }
  }, [watchlist]);

  const handleShowDetails = useCallback((item) => {
    // Normalize the item from TMDB to match the structure DetailsModal expects,
    // and provide safe fallbacks for all required fields.
    setSelectedItem({
      id: item.id,
      title: item.title || item.name || '',
      name: item.name || item.title || '',
      poster: item.poster || item.poster_path || '/placeholder-image.svg',
      poster_path: item.poster_path || item.poster || '',
      media_type: item.media_type || 'movie',
      release_date: item.release_date || item.first_air_date || '',
      overview: item.overview || '',
      vote_average: typeof item.vote_average === 'number' ? item.vote_average : 0,
      genres: item.genres || [],
      number_of_seasons: item.number_of_seasons || null,
      number_of_episodes: item.number_of_episodes || null,
      runtime: item.runtime || null,
      external_ids: item.external_ids || {},
      watch_providers: item.watch_providers || undefined,
      status: item.status || undefined,
      watchedDate: item.watchedDate || item.watched_date || undefined,
      // ...spread any other properties for safety
      ...item
    });
  }, []);

  const handleSaveNewItemSuccess = useCallback(async (savedItem) => {
    // Revalidate any SWR key that starts with /api/watchlist to ensure
    // the watchlist page gets the latest data.
    mutate((key) => typeof key === 'string' && key.startsWith('/api/watchlist'), undefined, { revalidate: true });
    // Close the modal
    setWatchlistItem(null);
  }, [mutate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Safety check: don't process keyboard shortcuts if a modal is open
      if (selectedItem || watchlistItem) {
        return;
      }
      
      // Don't trigger shortcuts if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Navigation shortcuts
      if (e.key === 'ArrowRight' && page < totalPages) {
        // Next page with right arrow
        setPage(prev => Math.min(prev + 1, totalPages));
      } else if (e.key === 'ArrowLeft' && page > 1) {
        // Previous page with left arrow
        setPage(prev => Math.max(prev - 1, 1));
      } else if (e.key === '/') {
        // Focus search with forward slash
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      // Removed Escape key handler here to avoid conflicts
      else if (e.key === 'm') {
        // Toggle media filter (movies)
        setMediaFilter(prev => prev === 'movie' ? 'all' : 'movie');
      } else if (e.key === 't') {
        // Toggle media filter (TV)
        setMediaFilter(prev => prev === 'tv' ? 'all' : 'tv');
      } else if (e.key === 'p') {
        // Toggle discovery mode to popular
        setDiscoveryMode(prev => prev === 'popular' ? 'text' : 'popular');
      } else if (e.key === 'r') {
        // Toggle discovery mode to top_rated
        setDiscoveryMode(prev => prev === 'top_rated' ? 'text' : 'top_rated');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, totalPages, searchInput, selectedItem, watchlistItem, setSearchInput]);

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

  // Group all filters into a single object for dependency tracking
  const filters = useMemo(() => ({
    mediaFilter,
    selectedGenreId,
    minRating,
    sortOrder,
    excludeWatchlist,
    discoveryMode
  }), [mediaFilter, selectedGenreId, minRating, sortOrder, excludeWatchlist, discoveryMode]);

  // Only reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Always trigger search when filters, searchQuery, or page changes
  useEffect(() => {
    const delay = discoveryMode === 'text' ? 500 : 0;
    const timeoutId = setTimeout(() => handleSearch(searchQuery), delay);
    return () => clearTimeout(timeoutId);
  }, [filters, searchQuery, page, handleSearch, discoveryMode]);

  // Determine if the selected item is in the watchlist
  const selectedItemIsInWatchlist = useMemo(() => {
    if (!selectedItem || !Array.isArray(watchlist)) return false;
    return watchlist.some(w => String(w.movie_id) === String(selectedItem.id));
  }, [selectedItem, watchlist]);

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
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
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
            <div className="relative w-full sm:max-w-2xl">
              <Input
                type="text"
                placeholder="Search for movies or TV shows..."
                value={searchInput}
                onChange={handleSearchChange} 
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    // Only blur the input, don't clear it
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                  }
                }}
                className="w-full bg-gray-800 border-gray-700 text-white rounded-full py-2 pl-4 pr-20 min-h-[44px]"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchInput('')}
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
            <List className="h-4 w-4" /> All ({totalAllCount}{excludeWatchlist ? '*' : ''})
          </Button>
          <Button onClick={() => setMediaFilter('movie')} className={`flex items-center gap-1 ${mediaFilter === 'movie' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <Film className="h-4 w-4" /> Movies ({movieCount}{excludeWatchlist ? '*' : ''})
          </Button>
          <Button onClick={() => setMediaFilter('tv')} className={`flex items-center gap-1 ${mediaFilter === 'tv' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <Tv className="h-4 w-4" /> TV Shows ({tvCount}{excludeWatchlist ? '*' : ''})
          </Button>
        </div>
        {excludeWatchlist && (
          <div className="mb-4 flex justify-center">
            <p className="text-sm text-gray-400">
              * Counts shown are for filtered results (excluding watchlist items)
            </p>
          </div>
        )}
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {/* Genre Filter */}
          <Select onValueChange={setSelectedGenreId} value={selectedGenreId}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 min-h-[44px]">
              <SelectValue placeholder="Select Genre" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="all" className="min-h-[40px]">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.id} value={genre.id.toString()} className="min-h-[40px]">
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Minimum Rating Filter */}
          <Select onValueChange={setMinRating} value={minRating}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 min-h-[44px]">
              <SelectValue placeholder="Min Rating" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="0" className="min-h-[40px]">Any Rating</SelectItem>
              <SelectItem value="6" className="min-h-[40px]">6+</SelectItem>
              <SelectItem value="7" className="min-h-[40px]">7+</SelectItem>
              <SelectItem value="8" className="min-h-[40px]">8+</SelectItem>
              <SelectItem value="9" className="min-h-[40px]">9+</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By Filter */}
          <Select onValueChange={setSortOrder} value={sortOrder}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 min-h-[44px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="popularity.desc" className="min-h-[40px]">Relevance</SelectItem>
              <SelectItem value="release_date.desc" className="min-h-[40px]">Release Date (Newest)</SelectItem>
              <SelectItem value="release_date.asc" className="min-h-[40px]">Release Date (Oldest)</SelectItem>
              <SelectItem value="title.asc" className="min-h-[40px]">Title (A-Z)</SelectItem>
              <SelectItem value="title.desc" className="min-h-[40px]">Title (Z-A)</SelectItem>
              <SelectItem value="vote_average.desc" className="min-h-[40px]">Rating (High-Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <ClientCheckbox
              id="exclude-watchlist"
              checked={excludeWatchlist}
              disabled={isWatchlistLoading}
              onCheckedChange={(newValue) => {
                setExcludeWatchlist(newValue);
              }}
            />
            <label
              htmlFor="exclude-watchlist"
              className="text-sm font-medium leading-none cursor-pointer text-white hover:text-gray-300 select-none"
              onClick={() => {
                if (!isWatchlistLoading) {
                  setExcludeWatchlist(!excludeWatchlist);
                }
              }}
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
                <Button onClick={() => { setSearchInput("Marvel"); handleSearch("Marvel"); }}>
                  Try "Marvel"
                </Button>
                <Button onClick={() => { setSearchInput("Star Wars"); handleSearch("Star Wars"); }}>
                  Try "Star Wars"
                </Button>
                <Button onClick={() => { setSearchInput("Breaking Bad"); handleSearch("Breaking Bad"); }}>
                  Try "Breaking Bad"
                </Button>
                <Button onClick={() => { setSearchInput("Stranger Things"); handleSearch("Stranger Things"); }}>
                  Try "Stranger Things"
                </Button>
              </div>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-lg max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-gray-400 mb-6">
              Try changing your search term or filters to find more content.
            </p>
            <div className="flex gap-3 justify-center">
              {searchInput && (
                <Button 
                  onClick={() => setSearchInput('')} 
                  className="bg-indigo-700 hover:bg-indigo-600"
                >
                  Clear search
                </Button>
              )}
              {(mediaFilter !== 'all' || selectedGenreId !== 'all' || minRating !== '0') && (
                <Button 
                  onClick={() => {
                    setMediaFilter('all');
                    setSelectedGenreId('all');
                    setMinRating('0');
                  }} 
                  className="bg-indigo-700 hover:bg-indigo-600"
                >
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 search-results-grid">
            {searchResults.map((item, index) => (
              <MovieCard
                key={item.id}
                movie={item}
                onAddToWatchlist={() => handleAddToWatchlist(item)}
                onShowDetails={handleShowDetails}
                priority={index < 10} /* Prioritize loading the first 10 images */
              />
            ))}
          </div>
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
      {selectedItem && (
        console.log('Rendering DetailsModal with selectedItem:', selectedItem),
        <ErrorBoundary>
          <DynamicDetailsModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAddToWatchlist={() => handleAddToWatchlist(selectedItem)}
            isInWatchlist={selectedItemIsInWatchlist}
          />
        </ErrorBoundary>
      )}
      {watchlistItem && (
        <DynamicAddToWatchlistModal
          item={watchlistItem}
          mode={watchlistItem.mode || "add"}
          onClose={() => setWatchlistItem(null)}
          onSaveSuccess={handleSaveNewItemSuccess}
        />
      )}

      {/* Only render keyboard shortcuts help on desktop */}
      <DesktopOnlyKeyboardShortcuts />
    </div>
  );
}

// ErrorBoundary component for catching errors in modal rendering
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // You can log errorInfo here if needed
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 16 }}>Error: {this.state.error?.message || 'Unknown error'}</div>;
    }
    return this.props.children;
  }
}
