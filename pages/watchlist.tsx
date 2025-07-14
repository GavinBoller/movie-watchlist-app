// @ts-nocheck
// watchlist.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import useSWR from 'swr';
import { useSession, signIn } from 'next-auth/react';
import Header from '../components/Header';
import DynamicAddToWatchlistModal from '../components/DynamicAddToWatchlistModal';
import DynamicConfirmationModal from '../components/DynamicConfirmationModal';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import VoiceSearch from '../components/VoiceSearch';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Film, Tv, Edit, Trash2, List, ExternalLink, Clock, Star, X, AlertCircle, RefreshCcw } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import clientFetcher from '../utils/clientFetcher';
import { watchlistFetcher } from '../utils/watchlist-fallback';
import { useDebouncedSearch } from '../utils/useDebounce';
import { WatchlistResponse } from '../types';

const fetcher = async (url: string): Promise<WatchlistResponse> => {
  try {
    const data = await clientFetcher(url);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    // Re-throw the error so SWR can handle it properly
    throw error;
  }
};

interface WatchlistItemCardProps {
  item: WatchlistItem;
  onEdit: (item: WatchlistItem) => void;
  onDelete: (item: WatchlistItem) => void;
  priority?: boolean; // Add priority prop for image loading
}

const WatchlistItemCard = React.memo<WatchlistItemCardProps>(({ item, onEdit, onDelete, priority = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Detect if the device supports hover - use useLayoutEffect for faster initialization
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

  // Decode HTML entities in poster path (fix for items with encoded paths)
  const decodePoster = useCallback((poster) => {
    if (!poster) return null;
    // Decode common HTML entities
    return poster
      .replace(/&#x2F;/g, '/')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }, []);

  // Memoize the poster URL calculation
  const posterUrl = useMemo(() => {
    const decodedPoster = decodePoster(item.poster);
    return decodedPoster
      ? `https://image.tmdb.org/t/p/w300${decodedPoster}`
      : '/placeholder-image.svg';
  }, [item.poster, decodePoster]);

  // Handle tap/click based on device type
  const handleTap = () => {
    if (!isMounted) {
      // Fallback to edit action during SSR/initial render
      onEdit(item);
      return;
    }
    
    if (isTouchDevice) {
      if (!showInfo) {
        setShowInfo(true);
      } else {
        onEdit(item); // Open edit modal on second tap
      }
    } else {
      onEdit(item); // Open edit modal on click for desktop
    }
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer touch-manipulation"
      onMouseEnter={() => isMounted && !isTouchDevice && setIsHovered(true)}
      onMouseLeave={() => isMounted && !isTouchDevice && setIsHovered(false)}
      onClick={handleTap} // Use the new handler
    >
      <img 
        src={posterUrl} 
        alt={item.title} 
        className="w-full aspect-[2/3] object-cover" 
        loading={priority ? "eager" : "lazy"}
        width="300"
        height="450"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/placeholder-image.svg';
        }}
      />
      
      <div className={`absolute top-2 right-2 ${item.media_type === 'tv' ? 'bg-teal-600' : 'bg-purple-600'} text-white text-xs font-bold py-1 px-2 rounded-full z-20`}>
        {item.media_type === 'tv' ? 'TV' : 'Movie'}
      </div>
      
      {/* Always visible status indicator in top left */}
      <div className={`absolute top-2 left-2 z-20 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap capitalize shadow-md ${
        item.status === 'watched' ? 'bg-green-800' :
        item.status === 'watching' ? 'bg-yellow-800' : 'bg-blue-800'
      }`}>
        {(item.status || '').replace('_', ' ')}
      </div>
      
      {/* Use optimized transition with shorter duration */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-end p-4 transition-opacity duration-150 ${
          !isMounted ? 'opacity-0' : 
          isTouchDevice ? (showInfo ? 'opacity-100' : 'opacity-0') : 
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h3 className="font-bold text-sm sm:text-base md:text-lg">{item.title}</h3>
        <p className="text-xs sm:text-sm text-gray-300">
          {(item.release_date || '').split('-')[0]}
          {item.genres && ` • ${item.genres}`}
        </p>
        <div className="flex items-center text-xs text-gray-400 mt-1">
          <Clock className="h-3 w-3 mr-1" />
          <span>
            {item.media_type === 'tv'
              ? `${item.seasons || 'N/A'} seasons, ${item.episodes || 'N/A'} episodes`
              : item.runtime
              ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
              : 'N/A'}
          </span>
        </div>
        {item.vote_average != null && !isNaN(parseFloat(item.vote_average)) && (
          <div className="flex items-center mt-1">
            <span className="text-[#F5C518] font-bold text-xs sm:text-sm">
              {parseFloat(item.vote_average).toFixed(1)}
            </span>
            <Star className="h-3 sm:h-4 w-4 text-[#F5C518] fill-current ml-1" />
          </div>
        )}
        
        {/* Show touch-specific action buttons */}
        {isMounted && isTouchDevice && showInfo ? (
          <div className="flex flex-col mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="bg-[#E50914] text-white text-sm rounded-lg py-2 flex items-center justify-center"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                className="bg-red-600 text-white text-sm rounded-lg py-2 flex items-center justify-center"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap mt-2 gap-2">
            {item.imdb_id && (
              <Button 
                asChild
                size="sm" 
                className="bg-[#F5C518] text-black text-xs rounded-full py-1 px-3 hover:bg-yellow-400 min-w-[80px] min-h-[40px]" 
                aria-label="View on IMDb"
                onClick={(e) => e.stopPropagation()}
              >
                <a href={`https://www.imdb.com/title/${item.imdb_id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="View on IMDb">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  IMDb
                </a>
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded-full py-1 px-3 min-w-[80px] min-h-[40px]" 
              aria-label="Edit"
            >
              <Edit className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={(e) => { e.stopPropagation(); onDelete(item); }} 
              className="bg-red-800 hover:bg-red-700 text-white text-xs rounded-full py-1 px-3 min-w-[80px] min-h-[40px]" 
              aria-label="Delete"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export default function WatchlistPage() {
  const WATCHLIST_LIMIT = 50; // Temporarily lowered for testing
  const [sortOrder, setSortOrder] = useState('added_at_desc');
  const { value: searchInput, debouncedValue: search, onChange: handleSearchChange, setValue: setSearchInput } = useDebouncedSearch('', 400);
  const [mediaFilter, setMediaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const { addToast } = useToast();
  const { data: session, status } = useSession();
  
  // Redirect to sign-in if not authenticated
  useEffect(() => {
    console.log('Watchlist - Auth status:', status);
    
    // If still loading, don't do anything yet
    if (status === 'loading') {
      return;
    }
    
    // If authenticated, clear any redirect protection flags
    if (status === 'authenticated') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('lastSignInAttempt');
        sessionStorage.removeItem('lastWatchlistRedirect');
        sessionStorage.setItem('isAuthenticated', 'true');
      }
      return;
    }
    
    // At this point, we know status is 'unauthenticated'
    // Check if we have a recorded authenticated session in sessionStorage
    // This helps prevent flashes of unauthenticated state
    if (typeof window !== 'undefined') {
      const isStoredAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
      const authTime = parseInt(sessionStorage.getItem('authRedirectTime') || '0');
      const now = Date.now();
      
      // If we were recently authenticated (within last 30 seconds), don't redirect
      if (isStoredAuthenticated && authTime && (now - authTime < 30000)) {
        console.log('Recently authenticated according to sessionStorage, waiting for session to load');
        return;
      }
      
      // Check for recent redirect attempts to prevent loops
      const lastSignInAttempt = parseInt(sessionStorage.getItem('lastSignInAttempt') || '0');
      const timeSinceLastAttempt = now - lastSignInAttempt;
      
      // If it's been less than 10 seconds since our last attempt, don't try again
      if (lastSignInAttempt && timeSinceLastAttempt < 10000) {
        console.log('Preventing redirect loop - last attempt was', timeSinceLastAttempt, 'ms ago');
        
        // If we're in a persistent loop, redirect to home instead
        if (timeSinceLastAttempt < 2000) {
          console.log('Detected very rapid redirect cycle, breaking loop by redirecting to home');
          
          addToast({
            id: Date.now(),
            title: 'Authentication Issue',
            description: 'We encountered an issue with your session. Please try signing in again from the home page.',
            variant: 'destructive',
          });
          
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          return;
        }
        
        return;
      }
      
      // Store the timestamp of this sign-in attempt
      sessionStorage.setItem('lastSignInAttempt', now.toString());
      // Show toast with sign-in button instead of auto-redirecting
      addToast({
        id: Date.now(),
        title: 'Authentication Required',
        description: 'You need to sign in to view your watchlist.',
        variant: 'destructive',
        action: {
          label: 'Sign In',
          onClick: () => {
            console.log('Initiating sign-in from watchlist toast');
            signIn('google', { callbackUrl: '/watchlist' }); // Redirect back to watchlist after login
          }
        }
      });
    }
  }, [status, addToast]);
  
  // Reset to page 1 whenever filters change to avoid viewing a non-existent page
  useEffect(() => {
    setPage(1);
  }, [sortOrder, search, mediaFilter, statusFilter]);

  // Memoize the SWR key to prevent unnecessary re-renders
  const swrKey = useMemo(() => 
    status === 'authenticated' 
      ? `/api/watchlist?sort_by=${sortOrder}&search=${search}&media=${mediaFilter}&status=${statusFilter}&page=${page}&limit=${WATCHLIST_LIMIT}`
      : null, // Don't fetch if not authenticated
    [status, sortOrder, search, mediaFilter, statusFilter, page, WATCHLIST_LIMIT]
  );
  
  const { data, error, mutate, isValidating } = useSWR(swrKey, watchlistFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 10 seconds (watchlist changes frequently by user)
    keepPreviousData: true, // Maintain previous data while loading new data
    revalidateIfStale: false, // Don't revalidate stale data automatically to prevent UI flicker
    focusThrottleInterval: 5000, // Throttle focus events to prevent excessive revalidation
    loadingTimeout: 3000, // Consider request as slow after 3 seconds
    onError: (err) => {
      console.error("SWR Error:", err);
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to load your watchlist. Please try again.';
      let errorTitle = 'Error';
      let errorAction = null;
      
      if (err.isOffline) {
        errorMessage = 'You are offline. Please check your internet connection.';
      } else if (err.isTimeout) {
        errorMessage = 'Request timed out. The server is taking too long to respond.';
      } else if (err.status === 401 || err.status === 403) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Please sign in to view your watchlist.';
        errorAction = {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth/signin?callbackUrl=/search'
        };
      } else if (err.status === 429) {
        errorMessage = 'Too many requests. Please try again in a moment.';
      } else if (err.status >= 500) {
        errorMessage = 'Server error. Our team has been notified.';
      } else if (err.info && err.info.message) {
        errorMessage = err.info.message;
      }
      
      addToast({
        id: Date.now(),
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        action: errorAction
      });
    }
  });

  const isLoading = !data && !error;

  // Memoize the totalPages calculation to prevent recalculating on every render
  const totalPages = useMemo(() => 
    data ? Math.ceil(data.total / WATCHLIST_LIMIT) : 0,
    [data, WATCHLIST_LIMIT]
  );
  
  // Keyboard navigation and shortcuts - defined after totalPages calculation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
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
      } else if (e.key === '1') {
        // Set status filter to "to_watch"
        setStatusFilter(prev => prev === 'to_watch' ? 'all' : 'to_watch');
      } else if (e.key === '2') {
        // Set status filter to "watching" 
        setStatusFilter(prev => prev === 'watching' ? 'all' : 'watching');
      } else if (e.key === '3') {
        // Set status filter to "watched"
        setStatusFilter(prev => prev === 'watched' ? 'all' : 'watched');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, totalPages, searchInput, setSearchInput, setMediaFilter, setStatusFilter, setPage]);

  // Memoize event handlers with useCallback to prevent unnecessary re-renders
  const handleDeleteClick = useCallback((item) => {
    setItemToDelete(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    
    setIsDeletingItem(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemToDelete.id }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete item.');
      }
      
      addToast({ 
        id: Date.now(), 
        title: 'Success', 
        description: `"${itemToDelete.title}" removed from watchlist.`,
        variant: 'success'
      });
      
      // Optimistically update the UI
      mutate(
        (currentData) => {
          if (!currentData) return null;
          return {
            ...currentData,
            items: currentData.items.filter(item => item.id !== itemToDelete.id),
            total: currentData.total - 1,
            filterCounts: {
              ...currentData.filterCounts,
              media: {
                ...currentData.filterCounts.media,
                [itemToDelete.media_type]: currentData.filterCounts.media[itemToDelete.media_type] - 1,
                all: currentData.filterCounts.media.all - 1
              },
              status: {
                ...currentData.filterCounts.status,
                [itemToDelete.status]: currentData.filterCounts.status[itemToDelete.status] - 1,
                all: currentData.filterCounts.status.all - 1
              }
            }
          };
        },
        true // Revalidate data
      );
    } catch (err) {
      console.error('Delete error:', err);
      addToast({ 
        id: Date.now(), 
        title: 'Error', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsDeletingItem(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, addToast, mutate]);

  const handleSaveSuccess = useCallback((updatedItem) => {
    // Optimistic UI update for a snappier experience
    mutate(
      (currentData) => {
        if (!currentData) return null;
        const updatedItems = currentData.items.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        );
        return { ...currentData, items: updatedItems };
      },
      true // Tell SWR to re-fetch immediately after the optimistic update to ensure consistency
    );
  }, [mutate]);

  const handleEdit = useCallback((item) => {
    // Map seasonnumber (from DB) to seasonNumber (for modal)
    setEditingItem({
      ...item,
      seasonNumber: item.seasonNumber ?? item.seasonnumber ?? '',
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">My Watchlist</h1>

        {status === 'loading' && (
          <div className="flex flex-col justify-center items-center mt-32">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500">Checking authentication status...</p>
          </div>
        )}
        
        {status === 'unauthenticated' && (
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-500 mb-6">You need to sign in to view and manage your watchlist</p>
            <button 
              onClick={() => window.location.href = '/auth/signin'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              Sign In
            </button>
          </div>
        )}
        
        {status === 'authenticated' && (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search Input with embedded Voice Search */}
              <div className="relative w-full md:flex-1">
                <Input
                  type="text"
                  placeholder="Search your watchlist..."
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
                  className="w-full bg-gray-800 border-gray-700 text-white py-2 pl-4 pr-20 min-h-[44px]"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchInput('')}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <VoiceSearch 
                    onResult={(transcript) => {
                      setSearchInput(transcript);
                    }}
                    placeholder="Click to start voice search"
                    className="flex-shrink-0"
                    // Debug mode disabled for production
                    // initialDebugMode={typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)}
                  />
                </div>
              </div>
              <Select onValueChange={setSortOrder} defaultValue={sortOrder}>
                <SelectTrigger className="w-full md:w-[200px] bg-gray-800 border-gray-700 min-h-[44px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="added_at_desc" className="min-h-[40px]">Recently Added</SelectItem>
                  <SelectItem value="release_date_desc" className="min-h-[40px]">Release Date (Newest)</SelectItem>
                  <SelectItem value="release_date_asc" className="min-h-[40px]">Release Date (Oldest)</SelectItem>
                  <SelectItem value="title_asc" className="min-h-[40px]">Title (A-Z)</SelectItem>
                  <SelectItem value="title_desc" className="min-h-[40px]">Title (Z-A)</SelectItem>
                  <SelectItem value="vote_average_desc" className="min-h-[40px]">Rating (High-Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4 flex justify-center gap-2 flex-wrap">
              <Button onClick={() => setMediaFilter('all')} className={`flex items-center gap-1 ${mediaFilter === 'all' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'} ${isValidating && !isLoading ? 'opacity-80' : ''}`}>
                <List className="h-4 w-4" /> All ({data?.filterCounts?.media?.all || 0})
                {isValidating && !isLoading && <span className="ml-1 h-2 w-2 rounded-full bg-white animate-pulse"></span>}
              </Button>
              <Button onClick={() => setMediaFilter('movie')} className={`flex items-center gap-1 ${mediaFilter === 'movie' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'} ${isValidating && !isLoading ? 'opacity-80' : ''}`}>
                <Film className="h-4 w-4" /> Movies ({data?.filterCounts?.media?.movie || 0})
                {isValidating && !isLoading && <span className="ml-1 h-2 w-2 rounded-full bg-white animate-pulse"></span>}
              </Button>
              <Button onClick={() => setMediaFilter('tv')} className={`flex items-center gap-1 ${mediaFilter === 'tv' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-700 hover:bg-gray-600'} ${isValidating && !isLoading ? 'opacity-80' : ''}`}>
                <Tv className="h-4 w-4" /> TV ({data?.filterCounts?.media?.tv || 0})
                {isValidating && !isLoading && <span className="ml-1 h-2 w-2 rounded-full bg-white animate-pulse"></span>}
              </Button>
            </div>
            <div className="mb-6 flex justify-center gap-2 flex-wrap">
              <Button onClick={() => setStatusFilter('all')} className={`text-xs sm:text-sm h-10 min-h-[44px] min-w-[90px] px-3 ${statusFilter === 'all' ? 'bg-[#E50914] hover:bg-[#f6121d] text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                All Status ({data?.filterCounts?.status?.all || 0})
              </Button>
              <Button onClick={() => setStatusFilter('to_watch')} className={`text-xs sm:text-sm h-10 min-h-[44px] min-w-[90px] px-3 ${statusFilter === 'to_watch' ? 'bg-blue-800 hover:bg-blue-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                To Watch ({data?.filterCounts?.status?.to_watch || 0})
              </Button>
              <Button onClick={() => setStatusFilter('watching')} className={`text-xs sm:text-sm h-10 min-h-[44px] min-w-[90px] px-3 ${statusFilter === 'watching' ? 'bg-yellow-800 hover:bg-yellow-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                Watching ({data?.filterCounts?.status?.watching || 0})
              </Button>
              <Button onClick={() => setStatusFilter('watched')} className={`text-xs sm:text-sm h-10 min-h-[44px] min-w-[90px] px-3 ${statusFilter === 'watched' ? 'bg-green-800 hover:bg-green-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                Watched ({data?.filterCounts?.status?.watched || 0})
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="rounded-lg overflow-hidden">
                    <Skeleton className="w-full aspect-[2/3]" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {error.status === 401 ? 'Authentication Required' : 'Failed to load your watchlist'}
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {error.status === 401 
                    ? "Please sign in to view your watchlist" 
                    : (error.info?.message || error.message || "There was a problem loading your watchlist. Please try again.")}
                </p>
                {error.status === 401 ? (
                  <Button 
                    onClick={() => window.location.href = '/auth/signin?callbackUrl=/search'} 
                    className="bg-indigo-700 hover:bg-indigo-600 flex items-center"
                  >
                    Sign In
                  </Button>
                ) : (
                  <Button 
                    onClick={() => mutate()} 
                    className="bg-indigo-700 hover:bg-indigo-600 flex items-center"
                    disabled={isValidating}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    {isValidating ? 'Retrying...' : 'Try Again'}
                  </Button>
                )}
              </div>
            ) : data.items.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-4">
                  {search || mediaFilter !== 'all' || statusFilter !== 'all' ? (
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  ) : (
                    <List className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                {search || mediaFilter !== 'all' || statusFilter !== 'all' ? (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                    <p className="text-gray-400 mb-6">
                      Try changing your search term or filters to find items in your watchlist.
                    </p>
                    <div className="flex gap-3 justify-center">
                      {search && (
                        <Button 
                          onClick={() => setSearchInput('')} 
                          className="bg-indigo-700 hover:bg-indigo-600"
                        >
                          Clear search
                        </Button>
                      )}
                      {(mediaFilter !== 'all' || statusFilter !== 'all') && (
                        <Button 
                          onClick={() => {
                            setMediaFilter('all');
                            setStatusFilter('all');
                          }} 
                          className="bg-indigo-700 hover:bg-indigo-600"
                        >
                          Reset filters
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h3>
                    <p className="text-gray-400 mb-6">
                      Use the search page to find movies and TV shows to add to your watchlist.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/search'} 
                      className="bg-[#E50914] hover:bg-[#f6121d]"
                    >
                      Find something to watch
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 watchlist-grid">
                {data.items.map((item, index) => (
                  <WatchlistItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => handleDeleteClick(item)}
                    priority={index < 10} /* Prioritize loading the first 10 images */
                  />
                ))}
              </div>
            )}

            {data && data.total > WATCHLIST_LIMIT && (
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
          </>
        )}
      </div>

      {editingItem && (
        <DynamicAddToWatchlistModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          mode="edit"
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {itemToDelete && (
        <DynamicConfirmationModal
          isOpen={!!itemToDelete}
          onClose={() => !isDeletingItem && setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to permanently delete "${itemToDelete.title}" from your watchlist?`}
          isLoading={isDeletingItem}
        />
      )}

      {/* Keyboard shortcuts help component */}
      <KeyboardShortcutsHelp />
    </div>
  );
}
