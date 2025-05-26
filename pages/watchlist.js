import { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/ToastContext';
import DetailsModal from '../components/DetailsModal';
import EditModal from '../components/EditModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { Film, Tv2, Search, Clock, PlayCircle, CheckCircle, Info, Edit, Trash } from 'lucide-react';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [filteredWatchlist, setFilteredWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const searchInputRef = useRef(null);
  const { addToast } = useToast();

  // Fetch watchlist and enhance with additional data
  useEffect(() => {
    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/watchlist');
        if (!res.ok) throw new Error('Failed to fetch watchlist');
        const data = await res.json();
        // Fetch additional details for each item
        const enhancedData = await Promise.all(
          data.map(async (item) => {
            try {
              const endpoint =
                item.media_type === 'movie'
                  ? `https://api.themoviedb.org/3/movie/${item.id}`
                  : `https://api.themoviedb.org/3/tv/${item.id}`;
              const detailRes = await fetch(`${endpoint}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
              if (!detailRes.ok) throw new Error('Failed to fetch details');
              const detailData = await detailRes.json();
              return {
                ...item,
                genres: detailData.genres ? detailData.genres.map((g) => g.name) : [],
                status: item.status || 'to_watch',
                platform: item.platform || '',
                notes: item.notes || '',
                watched_date: item.watched_date || '',
              };
            } catch (error) {
              return {
                ...item,
                genres: [],
                status: item.status || 'to_watch',
                platform: item.platform || '',
                notes: item.notes || '',
                watched_date: item.watched_date || '',
              };
            }
          })
        );
        setWatchlist(enhancedData);
        setFilteredWatchlist(enhancedData);
      } catch (error) {
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

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...watchlist];

    // Search
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Media Type Filter
    if (mediaFilter !== 'all') {
      filtered = filtered.filter((item) => item.media_type === mediaFilter);
    }

    // Status Filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Genre Filter
    if (genreFilter) {
      filtered = filtered.filter((item) =>
        item.genres.some((genre) => genre.toLowerCase() === genreFilter.toLowerCase())
      );
    }

    // Platform Filter
    if (platformFilter) {
      filtered = filtered.filter((item) => item.platform === platformFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortOption === 'recent') {
        return new Date(b.added_at || 0) - new Date(a.added_at || 0);
      } else if (sortOption === 'oldest') {
        return new Date(a.added_at || 0) - new Date(b.added_at || 0);
      } else if (sortOption === 'title_asc') {
        return a.title.localeCompare(b.title);
      } else if (sortOption === 'title_desc') {
        return b.title.localeCompare(a.title);
      } else if (sortOption === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

    setFilteredWatchlist(filtered);
  }, [watchlist, searchQuery, mediaFilter, statusFilter, genreFilter, platformFilter, sortOption]);

  // Keyboard shortcuts
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
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) throw new Error('Failed to delete item');
      setWatchlist((prev) => prev.filter((i) => i.id !== item.id));
      addToast({
        id: Date.now(),
        title: 'Success!',
        description: `${item.title} removed from watchlist.`,
      });
    } catch (error) {
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to delete item: ' + error.message,
        variant: 'destructive',
      });
    }
    setDeletingItem(null);
  };

  const handleAddToWatchlist = async (result) => {
    const media = {
      id: String(result.id),
      title: result.title || result.name,
      overview: result.overview,
      poster: result.poster_path,
      release_date: result.release_date || result.first_air_date,
      media_type: result.media_type,
    };

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(media),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add to watchlist');
      setWatchlist((prev) => [
        ...prev,
        { ...media, status: 'to_watch', added_at: new Date().toISOString() },
      ]);
      addToast({
        id: Date.now(),
        title: 'Success!',
        description: `${media.title} added to watchlist`,
      });
    } catch (error) {
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to add to watchlist: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  // Stats
  const totalItems = watchlist.length;
  const movieCount = watchlist.filter((item) => item.media_type === 'movie').length;
  const tvCount = watchlist.filter((item) => item.media_type === 'tv').length;

  // Unique genres and platforms
  const allGenres = Array.from(new Set(watchlist.flatMap((item) => item.genres))).sort();
  const allPlatforms = Array.from(new Set(watchlist.map((item) => item.platform).filter(Boolean))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#292929] rounded-lg p-4 flex items-center">
          <span className="text-white font-semibold mr-2">Total Items:</span>
          <span className="text-gray-300">{totalItems}</span>
        </div>
        <div className="bg-[#292929] rounded-lg p-4 flex items-center">
          <Film className="h-5 w-5 text-[#E50914] mr-2" />
          <span className="text-white font-semibold mr-2">Movies:</span>
          <span className="text-gray-300">{movieCount}</span>
        </div>
        <div className="bg-[#292929] rounded-lg p-4 flex items-center">
          <Tv2 className="h-5 w-5 text-[#E50914] mr-2" />
          <span className="text-white font-semibold mr-2">TV Shows:</span>
          <span className="text-gray-300">{tvCount}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#292929] rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search watchlist..."
                className="w-full pl-10 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
                aria-label="Search watchlist"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Media Type Filter */}
            <select
              value={mediaFilter}
              onChange={(e) => setMediaFilter(e.target.value)}
              className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Media</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="to_watch">To Watch</option>
              <option value="watching">Watching</option>
              <option value="watched">Watched</option>
            </select>

            {/* Genre Filter */}
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Genres</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Platforms</option>
              {allPlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="recent">Sort: Recent</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="title_asc">Sort: Title A-Z</option>
              <option value="title_desc">Sort: Title Z-A</option>
              <option value="rating">Sort: Rating</option>
            </select>
          </div>
        </div>

        {/* Reset Filters */}
        {(searchQuery || mediaFilter !== 'all' || statusFilter !== 'all' || genreFilter || platformFilter) && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setMediaFilter('all');
                setStatusFilter('all');
                setGenreFilter('');
                setPlatformFilter('');
                setSortOption('recent');
              }}
              className="text-[#E50914] hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Watchlist Entries */}
      {filteredWatchlist.length === 0 ? (
        <div className="text-center py-8">
          {watchlist.length === 0 ? (
            <div>
              <p className="text-gray-400 mb-4">Your watchlist is empty.</p>
              <p className="text-gray-300">
                Head to the <Link href="/" className="text-[#E50914] hover:underline">Search</Link> tab to add some movies or TV shows!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mb-4">No items match your search or filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setMediaFilter('all');
                  setStatusFilter('all');
                  setGenreFilter('');
                  setPlatformFilter('');
                  setSortOption('recent');
                }}
                className="text-[#E50914] hover:underline"
              >
                Clear Search and Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWatchlist.map((item) => (
            <div
              key={item.id}
              className="bg-[#292929] rounded-lg shadow-lg overflow-hidden flex"
            >
              {/* Poster */}
              <img
                src={
                  item.poster
                    ? `https://image.tmdb.org/t/p/w200${item.poster}`
                    : 'https://placehold.co/200x300?text=No+Poster'
                }
                alt={item.title}
                className="w-1/3 object-cover"
              />

              {/* Details */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-white truncate">{item.title}</h3>
                <p className="text-sm text-gray-400">
                  {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
                  {item.genres.length > 0 && ` • ${item.genres.join(', ')}`}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {item.status === 'to_watch' && (
                    <span className="flex items-center text-blue-400">
                      <Clock className="h-4 w-4 mr-1" /> To Watch
                    </span>
                  )}
                  {item.status === 'watching' && (
                    <span className="flex items-center text-green-400">
                      <PlayCircle className="h-4 w-4 mr-1" /> Watching
                    </span>
                  )}
                  {item.status === 'watched' && (
                    <span className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-1" /> Watched
                    </span>
                  )}
                  {item.platform && (
                    <span className="text-gray-300 text-sm">on {item.platform}</span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    aria-label="View Details"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    aria-label="Edit Item"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    aria-label="Delete Item"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
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

      {editingItem && (
        <EditModal
          item={editingItem}
          onSave={(updatedItem) => {
            setWatchlist((prev) =>
              prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
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
  );
}
