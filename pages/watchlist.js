'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { PlusCircle, ExternalLink, Star, Clock, Film, Tv, List, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import AddToWatchlistModal from '../components/AddToWatchlistModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

function WatchlistCard({ item, enhancedItems, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { addToast } = useToast();

  // Find enhanced item with TMDB data, fall back to original item
  const enhancedItem = enhancedItems.find(e => e.id === item.id) || item;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTap = (e) => {
    if (isMobile) {
      e.preventDefault();
      if (!showInfo) {
        setShowInfo(true);
      }
    }
  };

  const handleImdbLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const imdbId = enhancedItem.imdb_id || item.imdb_id;
    if (imdbId) {
      window.open(`https://www.imdb.com/title/${imdbId}`, '_blank', 'noopener,noreferrer');
    } else {
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'No IMDb link available',
        variant: 'destructive',
      });
    }
  };

  const title = enhancedItem.title || 'Unknown';
  const posterUrl = enhancedItem.poster
    ? `https://image.tmdb.org/t/p/w300${enhancedItem.poster}`
    : 'https://via.placeholder.com/300x450?text=No+Image';
  const badgeClass = enhancedItem.media_type === 'tv' ? 'bg-blue-600' : 'bg-[#E50914]';
  const typeBadge = enhancedItem.media_type === 'tv' ? 'TV' : 'Movie';
  const displayInfo = enhancedItem.release_date || enhancedItem.first_air_date
    ? `${(enhancedItem.release_date || enhancedItem.first_air_date).split('-')[0]} • ${enhancedItem.genres || 'N/A'}`
    : 'N/A';
  const voteAverage = typeof enhancedItem.vote_average === 'number' && !isNaN(enhancedItem.vote_average)
    ? enhancedItem.vote_average.toFixed(1)
    : parseFloat(enhancedItem.vote_average) && !isNaN(parseFloat(enhancedItem.vote_average))
    ? parseFloat(enhancedItem.vote_average).toFixed(1)
    : 'N/A';
  const runtime = enhancedItem.runtime
    ? `${Math.floor(enhancedItem.runtime / 60)}h ${enhancedItem.runtime % 60}m`
    : enhancedItem.seasons && enhancedItem.episodes
    ? `${enhancedItem.seasons} season${enhancedItem.seasons !== 1 ? 's' : ''}, ${enhancedItem.episodes} episode${enhancedItem.episodes !== 1 ? 's' : ''}`
    : enhancedItem.number_of_seasons && enhancedItem.number_of_episodes
    ? `${enhancedItem.number_of_seasons} season${enhancedItem.number_of_seasons !== 1 ? 's' : ''}, ${enhancedItem.number_of_episodes} episode${enhancedItem.number_of_episodes !== 1 ? 's' : ''}`
    : 'N/A';

  return (
    <div
      className="movie-card relative rounded-lg overflow-hidden group cursor-pointer touch-manipulation"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={handleTap}
      style={{ touchAction: 'manipulation' }}
      data-testid={`watchlist-${item.movie_id}`}
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
        <div className="flex mt-2 space-x-2 flex-wrap gap-y-2">
          {(enhancedItem.imdb_id || item.imdb_id) && (
            <Button
              asChild
              className="bg-[#F5C518] text-black text-xs rounded-full py-1 px-3 hover:bg-yellow-400 transition flex items-center min-w-[80px] touch-manipulation"
              style={{ touchAction: 'manipulation' }}
            >
              <a
                href={`https://www.imdb.com/title/${enhancedItem.imdb_id || item.imdb_id}`}
                onClick={handleImdbLink}
                onTouchStart={handleImdbLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                IMDb
              </a>
            </Button>
          )}
          <Button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="bg-blue-600 text-white text-xs rounded-full py-1 px-3 hover:bg-blue-700 transition-colors min-w-[80px]"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="bg-red-600 text-white text-xs rounded-full py-1 px-3 hover:bg-red-700 transition-colors min-w-[80px]"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editItem, setEditItem] = useState(null);
  const [enhancedItems, setEnhancedItems] = useState([]);
  const { addToast } = useToast();
  const limit = 50;

  const tmdbCache = new Map();

  const fetchTmdb = async (url) => {
    if (tmdbCache.has(url)) {
      console.log(`Cache hit for TMDB: ${url}`);
      return tmdbCache.get(url);
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`TMDB fetch failed for ${url}: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to fetch TMDB: ${res.statusText}`);
    }
    const data = await res.json();
    tmdbCache.set(url, data);
    return data;
  };

  const { data, error, mutate } = useSWR(
    `/api/watchlist?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}&media=${mediaFilter}&status=${statusFilter}`,
    fetcher,
    { revalidateOnFocus: false, fallbackData: { items: [], total: 0, filterCounts: {} } }
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    console.log('Watchlist SWR Success:', data);
  }, [data]);

  useEffect(() => {
    const enhanceItems = async () => {
      if (!data?.items || data.items.length === 0) {
        setEnhancedItems([]);
        return;
      }

      const enhanced = await Promise.all(
        data.items.map(async (item) => {
          try {
            const detailUrl = `https://api.themoviedb.org/3/${item.media_type}/${item.movie_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=external_ids`;
            const details = await fetchTmdb(detailUrl);
            return {
              ...item,
              genres: details.genres?.map(g => g.name).join(', ') || item.genres || 'N/A',
              runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]) || item.runtime || null,
              vote_average: details.vote_average ? parseFloat(details.vote_average) : item.vote_average || null,
              release_date: item.media_type === 'movie' ? details.release_date || item.release_date : item.release_date,
              first_air_date: item.media_type === 'tv' ? details.first_air_date || item.first_air_date : item.first_air_date,
              imdb_id: details.external_ids?.imdb_id || item.imdb_id || null,
              number_of_seasons: item.media_type === 'tv' ? details.number_of_seasons || item.seasons : item.seasons,
              number_of_episodes: item.media_type === 'tv' ? details.number_of_episodes || item.episodes : item.episodes,
            };
          } catch (error) {
            console.warn(`Failed to fetch TMDB details for ${item.movie_id}:`, error);
            return {
              ...item,
              genres: item.genres || 'N/A',
              runtime: item.runtime || null,
            };
          }
        })
      );
      setEnhancedItems(enhanced);
    };

    enhanceItems();
  }, [data?.items]);

  const handleEdit = (item) => {
    const enhancedItem = enhancedItems.find(e => e.id === item.id) || item;
    setEditItem({
      ...enhancedItem,
      media_type: enhancedItem.media_type || 'movie',
      poster_path: enhancedItem.poster,
      title: enhancedItem.title,
      name: enhancedItem.title,
      vote_average: enhancedItem.vote_average ? parseFloat(enhancedItem.vote_average) : null,
      number_of_seasons: enhancedItem.number_of_seasons || enhancedItem.seasons,
      number_of_episodes: enhancedItem.number_of_episodes || enhancedItem.episodes,
      id: enhancedItem.id,
      movie_id: enhancedItem.movie_id || enhancedItem.id?.toString(),
      user_id: 1,
      watchlistId: enhancedItem.id,
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete item');
      }
      mutate();
      addToast({
        id: Date.now(),
        title: 'Success',
        description: 'Item deleted from watchlist',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEdit = async (item) => {
    try {
      const payload = {
        id: item.id || item.watchlistId,
        user_id: 1,
        movie_id: item.movie_id || item.id?.toString(),
        title: item.title || item.name,
        overview: item.overview || null,
        poster: item.poster || item.poster_path || null,
        release_date: item.release_date || item.first_air_date || null,
        media_type: item.media_type || 'movie',
        status: item.status || 'to_watch',
        platform: item.platform || null,
        notes: item.notes || null,
        watched_date: item.watched_date || null,
        imdb_id: item.imdb_id || null,
        vote_average: item.vote_average ? parseFloat(item.vote_average) : null,
        runtime: item.runtime || null,
        seasons: item.number_of_seasons || item.seasons || null,
        episodes: item.number_of_episodes || item.episodes || null,
      };

      console.log('Saving edit to watchlist:', payload);

      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update watchlist');
      }
      mutate();
      addToast({
        id: Date.now(),
        title: 'Success',
        description: 'Item updated',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating item:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, mediaFilter, statusFilter]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header />
        <div className="container mx-auto p-4 text-center">
          <p className="text-gray-300">Failed to load watchlist: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header />
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="w-full aspect-[2/3] bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { items = [], total = 0, filterCounts = {} } = data;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">My Watchlist</h1>
        <div className="mb-4 flex justify-center">
          <Input
            type="text"
            placeholder="Search watchlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-[50%] bg-gray-800 border-gray-700 text-white rounded-full py-2 px-4"
          />
        </div>
        <div className="mb-4 flex justify-center gap-2 flex-wrap">
          <Button
            onClick={() => setMediaFilter('all')}
            className={`flex items-center gap-1 ${mediaFilter === 'all' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <List className="h-4 w-4" />
            All ({filterCounts.media?.all || 0})
          </Button>
          <Button
            onClick={() => setMediaFilter('movie')}
            className={`flex items-center gap-1 ${mediaFilter === 'movie' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Film className="h-4 w-4" />
            Movies ({filterCounts.media?.movie || 0})
          </Button>
          <Button
            onClick={() => setMediaFilter('tv')}
            className={`flex items-center gap-1 ${mediaFilter === 'tv' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Tv className="h-4 w-4" />
            TV Shows ({filterCounts.media?.tv || 0})
          </Button>
          <Button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-1 ${statusFilter === 'all' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <List className="h-4 w-4" />
            All Status ({filterCounts.status?.all || 0})
          </Button>
          <Button
            onClick={() => setStatusFilter('to_watch')}
            className={`flex items-center gap-1 ${statusFilter === 'to_watch' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <List className="h-4 w-4" />
            To Watch ({filterCounts.status?.to_watch || 0})
          </Button>
          <Button
            onClick={() => setStatusFilter('watching')}
            className={`flex items-center gap-1 ${statusFilter === 'watching' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <List className="h-4 w-4" />
            Watching ({filterCounts.status?.watching || 0})
          </Button>
          <Button
            onClick={() => setStatusFilter('watched')}
            className={`flex items-center gap-1 ${statusFilter === 'watched' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <List className="h-4 w-4" />
            Watched ({filterCounts.status?.watched || 0})
          </Button>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300">No items in watchlist. Add some from the search page!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {items.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                enhancedItems={enhancedItems}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        <div className="flex justify-center mt-4 gap-2">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            Previous
          </Button>
          <span className="self-center">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            Next
          </Button>
        </div>
      </div>
      {editItem && (
        <AddToWatchlistModal
          item={editItem}
          onSave={async (payload) => {
            await handleSaveEdit(payload);
            setEditItem(null);
          }}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}