'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DetailsModal from '../components/DetailsModal';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Menu, Film, Tv2, Clock, PlayCircle, CheckCircle, Trash2, ExternalLink, Edit, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast, useWatchlist } from '../components/ToastContext';

export default function Watchlist() {
  const [mediaFilter, setMediaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editItem, setEditItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 50;
  const { addToast } = useToast();
  const { watchlist, isLoading, mutate } = useWatchlist();

  const mediaTypeFilters = [
    { value: 'all', label: 'All', icon: Menu },
    { value: 'movie', label: 'Movies', icon: Film },
    { value: 'tv', label: 'TV Shows', icon: Tv2 },
  ];

  const statusFilters = [
    { value: 'all', label: 'All', icon: Menu },
    { value: 'to_watch', label: 'To Watch', icon: Clock },
    { value: 'watching', label: 'Watching', icon: PlayCircle },
    { value: 'watched', label: 'Watched', icon: CheckCircle },
  ];

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
        description: 'Item removed from watchlist',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: `Failed to delete item: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item) => {
    setEditItem({
      ...item,
      poster_path: item.poster, // Normalize for AddToWatchlistModal
    });
  };

  const handleShowDetails = (item) => {
    setSelectedItem(item);
  };

  const handleSaveEdit = async (updatedItem) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatedItem.id,
          user_id: 1,
          movie_id: updatedItem.movie_id,
          title: updatedItem.title,
          overview: updatedItem.overview,
          poster: updatedItem.poster_path || updatedItem.poster,
          release_date: updatedItem.release_date,
          media_type: updatedItem.media_type,
          status: updatedItem.status,
          platform: updatedItem.platform,
          notes: updatedItem.notes,
          watched_date: updatedItem.watched_date,
          imdb_id: updatedItem.imdb_id,
          vote_average: updatedItem.vote_average,
          number_of_seasons: updatedItem.number_of_seasons,
          number_of_episodes: updatedItem.number_of_episodes,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update item');
      }
      mutate();
      setEditItem(null);
      addToast({
        id: Date.now(),
        title: 'Success',
        description: 'Watchlist item updated',
      });
    } catch (error) {
      console.error('Error updating item:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: `Failed to update item: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Count items in entire watchlist, not paginated subset
  const getFilterCount = (mediaValue, statusValue) => {
    return watchlist.filter(
      (item) =>
        (mediaValue === 'all' || item.media_type === mediaValue) &&
        (statusValue === 'all' || item.status === statusValue)
    ).length;
  };

  const filteredWatchlist = watchlist.filter(
    (item) =>
      (mediaFilter === 'all' || item.media_type === mediaFilter) &&
      (statusFilter === 'all' || item.status === statusFilter) &&
      (!searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredWatchlist.length / itemsPerPage);
  const paginatedWatchlist = filteredWatchlist.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Your Watchlist</h1>
        <div className="mb-4 flex flex-col items-center gap-2">
          <div className="flex gap-2">
            {mediaTypeFilters.map((filter) => (
              <Button
                key={filter.value}
                onClick={() => { setMediaFilter(filter.value); setPage(1); }}
                className={`flex items-center gap-1 ${
                  mediaFilter === filter.value
                    ? 'bg-[#E50914] hover:bg-[#f6121d]'
                    : 'bg-gray-700 hover:bg-gray-600'
                } transition-colors`}
              >
                <filter.icon className="h-4 w-4" />
                {filter.label} ({isLoading ? 0 : getFilterCount(filter.value, statusFilter)})
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                onClick={() => { setStatusFilter(filter.value); setPage(1); }}
                className={`flex items-center gap-1 ${
                  statusFilter === filter.value
                    ? 'bg-[#E50914] hover:bg-[#f6121d]'
                    : 'bg-gray-700 hover:bg-gray-600'
                } transition-colors`}
              >
                <filter.icon className="h-4 w-4" />
                {filter.label} ({isLoading ? 0 : getFilterCount(mediaFilter, filter.value)})
              </Button>
            ))}
          </div>
          <div className="w-full max-w-[50%] mt-2">
            <Input
              type="text"
              placeholder="Search your watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border-gray-700 text-white rounded-full py-2 px-4"
            />
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="w-full aspect-[2/3]" />
              </div>
            ))}
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300">
              {searchQuery ? 'No items match your search.' : 'Your watchlist is empty. Add some movies or shows!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {paginatedWatchlist.map((item) => (
                <div
                  key={item.id}
                  className="relative bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                  onClick={() => handleShowDetails(item)}
                >
                  <img
                    src={item.poster ? `https://image.tmdb.org/t/p/w300${item.poster}` : 'https://placehold.co/300x450?text=No+Image'}
                    alt={item.title}
                    className="w-full h-auto object-cover aspect-[2/3]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                    <h3 className="text-sm sm:text-base font-bold">{item.title}</h3>
                    <p className="text-xs text-gray-300">
                      Type: {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
                    </p>
                    <p className="text-xs text-gray-300">
                      Status: {item.status === 'to_watch' ? 'To Watch' : item.status === 'watching' ? 'Watching' : 'Watched'}
                    </p>
                    {item.platform && <p className="text-xs text-gray-300">Platform: {item.platform}</p>}
                    {item.watched_date && <p className="text-xs text-gray-300">Watched: {item.watched_date}</p>}
                    {item.notes && <p className="text-xs text-gray-300">Notes: {item.notes}</p>}
                    <div className="flex items-center text-xs text-gray-300 mt-1">
                      <Star className="h-3 w-3 text-[#F5C518] fill-current mr-1" />
                      <span>{item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    </div>
                    {item.media_type === 'tv' ? (
                      <p className="text-xs text-gray-300">
                        {item.seasons || 'N/A'} seasons, {item.episodes || 'N/A'} episodes
                      </p>
                    ) : (
                      <p className="text-xs text-gray-300">
                        Duration: {formatRuntime(item.runtime)}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {item.imdb_id && (
                        <Button
                          asChild
                          className="bg-[#F5C518] text-black text-xs rounded-full py-1 px-3 hover:bg-yellow-400 transition"
                        >
                          <a
                            href={`https://www.imdb.com/title/${item.imdb_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            IMDb
                          </a>
                        </Button>
                      )}
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                        className="bg-gray-700 text-white text-xs rounded-full py-1 px-3 hover:bg-gray-600 transition"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="bg-red-700 text-white text-xs rounded-full py-1 px-3 hover:bg-red-600 transition"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="self-center text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      {editItem && (
        <AddToWatchlistModal
          item={editItem}
          onSave={handleSaveEdit}
          onClose={() => setEditItem(null)}
        />
      )}
      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToWatchlist={() => setEditItem({ ...selectedItem, poster_path: selectedItem.poster })}
        />
      )}
    </div>
  );
}