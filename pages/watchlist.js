import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useToast } from '../components/ToastContext';
import Header from '../components/Header';
import DetailsModal from '../components/DetailsModal';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import EditModal from '../components/EditModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { Menu, Clock, PlayCircle, CheckCircle, Film, Tv, Edit, Trash, ExternalLink } from 'lucide-react';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [filteredWatchlist, setFilteredWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortOption, setSortOption] = useState('date_desc');
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToAdd, setItemToAdd] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const searchInputRef = useRef(null);
  const { addToast } = useToast();

  const statusFilters = [
    { value: 'all', label: 'All', icon: Menu },
    { value: 'to_watch', label: 'To Watch', icon: Clock },
    { value: 'watching', label: 'Watching', icon: PlayCircle },
    { value: 'watched', label: 'Watched', icon: CheckCircle },
  ];
  const mediaTypeFilters = [
    { value: 'all', label: 'All', icon: Menu },
    { value: 'movie', label: 'Movies', icon: Film },
    { value: 'tv', label: 'TV Shows', icon: Tv },
  ];

  useEffect(() => {
    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/watchlist');
        if (!res.ok) {
          throw new Error(`Failed to fetch watchlist: ${res.statusText}`);
        }
        const data = await res.json();
        const enhancedData = await Promise.all(
          data.map(async (item) => {
            try {
              const endpoint =
                item.media_type === 'movie'
                  ? `https://api.themoviedb.org/3/movie/${item.movie_id || item.id}`
                  : `https://api.themoviedb.org/3/tv/${item.movie_id || item.id}`;
              const detailRes = await fetch(`${endpoint}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
              if (!detailRes.ok) {
                throw new Error('Failed to fetch TMDB details');
              }
              const detailData = await detailRes.json();
              return {
                ...item,
                genres: detailData.genres ? detailData.genres.map((g) => g.name) : [],
                imdb_id: detailData.imdb_id || item.imdb_id || null,
              };
            } catch (error) {
              console.error(`Error fetching details for item ${item.movie_id || item.id}:`, error);
              return item;
            }
          })
        );
        setWatchlist(enhancedData);
        setFilteredWatchlist(enhancedData);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        addToast({
          id: Date.now(),
          title: 'Error',
          description: 'Failed to fetch watchlist.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, []);

  useEffect(() => {
    let filtered = [...watchlist];
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.overview?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query)
      );
    }
    if (mediaTypeFilter !== 'all') {
      filtered = filtered.filter((item) => item.media_type === mediaTypeFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    if (genreFilter !== 'all') {
      filtered = filtered.filter((item) => item.genres?.includes(genreFilter));
    }
    if (platformFilter !== 'all') {
      filtered = platformFilter === 'none'
        ? filtered.filter((item) => !item.platform)
        : filtered.filter((item) => item.platform === platformFilter);
    }
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date_desc':
          return new Date(b.added_at || 0).getTime() - new Date(a.added_at || 0).getTime();
        case 'date_asc':
          return new Date(a.added_at || 0).getTime() - new Date(b.added_at || 0).getTime();
        case 'title_asc':
          return a.title?.localeCompare(b.title || '') || 0;
        case 'title_desc':
          return b.title?.localeCompare(a.title || '') || 0;
        default:
          return 0;
      }
    });
    setFilteredWatchlist(filtered);
  }, [watchlist, searchQuery, mediaTypeFilter, statusFilter, genreFilter, platformFilter, sortOption]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const handleDelete = async (item) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.movie_id || item.id }),
      });
      if (!res.ok) {
        throw new Error('Failed to delete item');
      }
      setWatchlist((prev) => prev.filter((i) => (i.movie_id || i.id) !== (item.movie_id || item.id)));
      addToast({
        id: Date.now(),
        title: 'Success!',
        description: `${item.title || 'Item'} removed from watchlist.`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to delete item: ' + error.message,
        variant: 'destructive',
      });
    }
    setDeletingItem(null);
  };

  const handleAddToWatchlist = async (item) => {
    setItemToAdd(item);
  };

  const handleSaveToWatchlist = async (updatedItem) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(updatedItem.id),
          title: updatedItem.title || updatedItem.name || 'Untitled',
          overview: updatedItem.overview || null,
          poster: updatedItem.poster_path || updatedItem.poster || null,
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
      setWatchlist((prev) => [...prev, newItem]);
      addToast({
        id: Date.now(),
        title: 'Success!',
        description: `${updatedItem.title || 'Item'} added to watchlist`,
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw new Error(error.message || 'Failed to add to watchlist');
    }
  };

  const allGenres = Array.from(new Set(watchlist.flatMap((item) => item.genres || []))).sort();
  const allPlatforms = Array.from(new Set(watchlist.map((item) => item.platform).filter(Boolean))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Watchlist</h1>

        {/* Desktop Filter Buttons */}
        <div className="hidden md:flex justify-center gap-4 mb-4">
          <div className="bg-gray-800 p-2 rounded-lg">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                className={`px-4 py-2 mx-1 rounded ${statusFilter === filter.value ? 'bg-red-600 text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setStatusFilter(filter.value)}
              >
                <filter.icon className="inline-block w-4 h-4 mr-1" />
                {filter.label}
              </button>
            ))}
          </div>
          <div className="bg-gray-800 p-2 rounded-lg">
            {mediaTypeFilters.map((filter) => (
              <button
                key={filter.value}
                className={`px-4 py-2 mx-1 rounded ${mediaTypeFilter === filter.value ? 'bg-red-600 text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setMediaTypeFilter(filter.value)}
              >
                <filter.icon className="inline-block w-4 h-4 mr-1" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Filter Buttons */}
        <div className="md:hidden mb-4">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                className={`px-4 py-2.5 rounded-lg ${statusFilter === filter.value ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setStatusFilter(filter.value)}
              >
                <filter.icon className="inline-block w-4 h-4 mr-1" />
                {filter.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {mediaTypeFilters.map((filter) => (
              <button
                key={filter.value}
                className={`p-2 rounded-lg ${mediaTypeFilter === filter.value ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setMediaTypeFilter(filter.value)}
              >
                <filter.icon className="inline-block w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search watchlist..."
          className="w-full bg-gray-800 text-white border-gray-700 rounded-lg p-2 mb-4"
        />

        {/* Reset Filters */}
        {(searchQuery || mediaTypeFilter !== 'all' || statusFilter !== 'all' || genreFilter !== 'all' || platformFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setMediaTypeFilter('all');
              setStatusFilter('all');
              setGenreFilter('all');
              setPlatformFilter('all');
              setSortOption('date_desc');
            }}
            className="text-red-600 hover:underline mb-4"
          >
            Reset All Filters
          </button>
        )}

        {/* Watchlist Entries */}
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No items match your search or filters.</p>
            <p className="text-gray-300">
              Head to the <Link href="/" className="text-red-600 hover:underline">Search</Link> tab to add some movies or TV shows!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWatchlist.map((item) => (
              <div key={item.movie_id || item.id} className="bg-gray-800 rounded-lg overflow-hidden">
                {/* Mobile Layout */}
                <div className="md:hidden flex flex-col">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster || '/placeholder.jpg'}`}
                    alt={item.title || 'Item'}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3 flex flex-col">
                    <h2 className="font-bold truncate">{item.title || 'Untitled'}</h2>
                    <p className="text-gray-400">{item.release_date?.split('-')[0] || 'N/A'}</p>
                    <p className="text-green-500">{item.platform || 'None'}</p>
                    <p className="text-blue-400">{item.watched_date || 'Not watched'}</p>
                    <p className="text-gray-400 italic">{item.notes || 'No notes'}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {item.imdb_id ? (
                        <a
                          href={`https://www.imdb.com/title/${item.imdb_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-500"
                        >
                          IMDb
                        </a>
                      ) : (
                        <span className="text-gray-500">IMDb (N/A)</span>
                      )}
                      <button onClick={() => setEditingItem(item)} className="text-gray-300 hover:text-white">
                        Edit
                      </button>
                      <button onClick={() => setDeletingItem(item)} className="text-red-500 hover:text-red-400">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                {/* Desktop Layout */}
                <div className="hidden md:flex">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster || '/placeholder.jpg'}`}
                    alt={item.title || 'Item'}
                    className="w-28 h-full object-cover"
                  />
                  <div className="p-3 flex flex-col flex-grow">
                    <h2 className="font-bold truncate">{item.title || 'Untitled'}</h2>
                    <p className="text-gray-400">{item.release_date?.split('-')[0] || 'N/A'}</p>
                    <p className="text-green-500">{item.platform || 'None'}</p>
                    <p className="text-blue-400">{item.watched_date || 'Not watched'}</p>
                    <p className="text-gray-400 italic">{item.notes || 'No notes'}</p>
                    <div className="flex justify-end gap-2">
                      {item.imdb_id ? (
                        <a
                          href={`https://www.imdb.com/title/${item.imdb_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 text-yellow-500" />
                        </a>
                      ) : (
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      )}
                      <button onClick={() => setEditingItem(item)}>
                        <Edit className="w-4 h-4 text-gray-300 hover:text-white" />
                      </button>
                      <button onClick={() => setDeletingItem(item)}>
                        <Trash className="w-4 h-4 text-red-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {selectedItem && (
          <DetailsModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAddToWatchlist={handleAddToWatchlist}
          />
        )}
        {itemToAdd && (
          <AddToWatchlistModal
            item={itemToAdd}
            onSave={handleSaveToWatchlist}
            onClose={() => setItemToAdd(null)}
          />
        )}
        {editingItem && (
          <EditModal
            item={editingItem}
            onSave={(updatedItem) => {
              setWatchlist((prev) =>
                prev.map((i) => (i.movie_id || i.id) === (updatedItem.movie_id || updatedItem.id) ? updatedItem : i)
              );
            }}
            onClose={() => setEditingItem(null)}
          />
        )}
        {deletingItem && (
          <DeleteConfirmationModal
            item={deletingItem}
            onConfirm={() => handleDelete(deletingItem)}
            onCancel={() => setDeletingItem(null)}
          />
        )}
      </div>
    </div>
  );
}