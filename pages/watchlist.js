// watchlist.js
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Header from '../components/Header';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Film, Tv, Edit, Trash2, List, ExternalLink, Clock, Star, X } from 'lucide-react';
import { useToast } from '../components/ToastContext';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    error.info = await res.json().catch(() => ({})); // Handle cases where the error body isn't JSON
    error.status = res.status;
    throw error;
  }
  return res.json();
};

function WatchlistItemCard({ item, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  const posterUrl = item.poster
    ? `https://image.tmdb.org/t/p/w300${item.poster}`
    : 'https://placehold.co/300x450?text=No+Image';

  return (
    <div
      className="relative rounded-lg overflow-hidden group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(item)} // Clicking the card opens the edit modal
    >
      <img src={posterUrl} alt={item.title} className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
      
      <div className={`absolute top-2 right-2 ${item.media_type === 'tv' ? 'bg-blue-600' : 'bg-[#E50914]'} text-white text-xs font-bold py-1 px-2 rounded-full`}>
        {item.media_type === 'tv' ? 'TV' : 'Movie'}
      </div>
      
      <div
        className={`absolute inset-0 bg-black bg-opacity-90 flex flex-col justify-between p-3 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div>
          <h3 className="font-bold text-md mb-1">{item.title}</h3>
          <p className="text-xs text-gray-300 mb-1">
            {(item.release_date || '').split('-')[0]}
            {item.genres && ` • ${item.genres}`}
          </p>
          <div className="flex items-center text-xs text-gray-400 mb-2">
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
        </div>
        
        <div className="flex flex-col items-start mt-auto space-y-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap capitalize self-start ${
            item.status === 'watched' ? 'bg-green-800' :
            item.status === 'watching' ? 'bg-yellow-800' : 'bg-blue-800'
          }`}>
            {(item.status || '').replace('_', ' ')}
          </span>
          <div className="flex flex-wrap items-center gap-1 w-full">
            {item.imdb_id && (
              <Button asChild size="sm" className="h-7 px-2 bg-[#F5C518] text-black hover:bg-yellow-400" aria-label="View on IMDb"
                onClick={(e) => e.stopPropagation()}>
                <a href={`https://www.imdb.com/title/${item.imdb_id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="View on IMDb">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  IMDb
                </a>
              </Button>
            )}
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="bg-blue-800 hover:bg-blue-700 h-7 px-2 text-white" aria-label="Edit">
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(item); }} 
              className="bg-red-800 hover:bg-red-700 h-7 px-2" aria-label="Delete">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const WATCHLIST_LIMIT = 50; // Temporarily lowered for testing
  const [sortOrder, setSortOrder] = useState('added_at_desc');
  const [search, setSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { addToast } = useToast();

  // Reset to page 1 whenever filters change to avoid viewing a non-existent page
  useEffect(() => {
    setPage(1);
  }, [sortOrder, search, mediaFilter, statusFilter]);

  const swrKey = `/api/watchlist?sort_by=${sortOrder}&search=${search}&media=${mediaFilter}&status=${statusFilter}&page=${page}&limit=${WATCHLIST_LIMIT}`;
  const { data, error, mutate } = useSWR(swrKey, fetcher);

  const isLoading = !data && !error;

  const totalPages = data ? Math.ceil(data.total / WATCHLIST_LIMIT) : 0;

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemToDelete.id }),
      });
      if (!res.ok) throw new Error('Failed to delete item.');
      addToast({ id: Date.now(), title: 'Success', description: `"${itemToDelete.title}" removed from watchlist.` });
      mutate();
    } catch (err) {
      addToast({ id: Date.now(), title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleSaveSuccess = (updatedItem) => {
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
  };

  const handleEdit = (item) => {
    // Map seasonnumber (from DB) to seasonNumber (for modal)
    setEditingItem({
      ...item,
      seasonNumber: item.seasonNumber ?? item.seasonnumber ?? '',
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">My Watchlist</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Wrapper div to contain the Input and the X button */}
          <div className="relative w-full md:flex-1">
            <Input
              type="text"
              placeholder="Search your watchlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border-gray-700 text-white py-2 pl-4 pr-10" // Added pr-10 for button space
            />
            {search && ( // Only show the clear button if there's text in the search field
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label="Clear search" // Added for accessibility
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select onValueChange={setSortOrder} defaultValue={sortOrder}>
            <SelectTrigger className="w-full md:w-[200px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="added_at_desc">Recently Added</SelectItem>
              <SelectItem value="release_date_desc">Release Date (Newest)</SelectItem>
              <SelectItem value="release_date_asc">Release Date (Oldest)</SelectItem>
              <SelectItem value="title_asc">Title (A-Z)</SelectItem>
              <SelectItem value="title_desc">Title (Z-A)</SelectItem>
              <SelectItem value="vote_average_desc">Rating (High-Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 flex justify-center gap-2 flex-wrap">
          <Button onClick={() => setMediaFilter('all')} className={`flex items-center gap-1 ${mediaFilter === 'all' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <List className="h-4 w-4" /> All ({data?.filterCounts?.media?.all || 0})
          </Button>
          <Button onClick={() => setMediaFilter('movie')} className={`flex items-center gap-1 ${mediaFilter === 'movie' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <Film className="h-4 w-4" /> Movies ({data?.filterCounts?.media?.movie || 0})
          </Button>
          <Button onClick={() => setMediaFilter('tv')} className={`flex items-center gap-1 ${mediaFilter === 'tv' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <Tv className="h-4 w-4" /> TV ({data?.filterCounts?.media?.tv || 0})
          </Button>
        </div>
        <div className="mb-6 flex justify-center gap-2 flex-wrap">
          <Button onClick={() => setStatusFilter('all')} className={`text-xs h-8 ${statusFilter === 'all' ? 'bg-gray-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
            All Status ({data?.filterCounts?.status?.all || 0})
          </Button>
          <Button onClick={() => setStatusFilter('to_watch')} className={`text-xs h-8 ${statusFilter === 'to_watch' ? 'bg-blue-800' : 'bg-gray-800 hover:bg-gray-700'}`}>
            To Watch ({data?.filterCounts?.status?.to_watch || 0})
          </Button>
          <Button onClick={() => setStatusFilter('watching')} className={`text-xs h-8 ${statusFilter === 'watching' ? 'bg-yellow-800' : 'bg-gray-800 hover:bg-gray-700'}`}>
            Watching ({data?.filterCounts?.status?.watching || 0})
          </Button>
          <Button onClick={() => setStatusFilter('watched')} className={`text-xs h-8 ${statusFilter === 'watched' ? 'bg-green-800' : 'bg-gray-800 hover:bg-gray-700'}`}>
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
          <div className="text-center text-red-500">Failed to load watchlist.</div>
        ) : data.items.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Your watchlist is empty.</p>
            <p>Use the search page to find movies and TV shows to add.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.items.map((item) => (
              <WatchlistItemCard
                key={item.id}
                item={item}
                onEdit={() => setEditingItem(item)}
                onDelete={() => handleDeleteClick(item)}
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
      </div>

      {editingItem && (
        <AddToWatchlistModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          mode="edit"
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {itemToDelete && (
        <ConfirmationModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to permanently delete "${itemToDelete.title}" from your watchlist?`}
        />
      )}
    </div>
  );
}
