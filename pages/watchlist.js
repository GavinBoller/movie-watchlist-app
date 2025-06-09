import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "../utils/fetcher";
import MovieCard from "../components/MovieCard";
import DetailsModal from "../components/DetailsModal";
import Input from "../components/Input";
import { Film, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "../components/ToastContext";

export default function Watchlist() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("added.desc");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { watchlist: contextWatchlist } = useToast();

  const suggestions = [
    { query: "Marvel", label: "Try Marvel" },
    { query: "Star Wars", label: "Try Star Wars" },
    { query: "Breaking Bad", label: "Try Breaking Bad" },
    { query: "Stranger Things", label: "Try Stranger Things" },
  ];

  const { data: watchlistData, error } = useSWR("/api/watchlist?limit=50", fetcher);

  const watchlist = watchlistData?.data || contextWatchlist || [];

  const isInWatchlist = (id) => watchlist.some((item) => item.id === id);

  const filteredWatchlist = useMemo(() => {
    let filtered = watchlist;

    if (searchQuery) {
      filtered = filtered.filter((media) =>
        (media.title || media.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (mediaFilter !== "all") {
      filtered = filtered.filter((media) => media.media_type === mediaFilter);
    }

    if (genreFilter !== "all") {
      filtered = filtered.filter((media) =>
        media.genre_ids?.includes(parseInt(genreFilter))
      );
    }

    return filtered.sort((a, b) => {
      if (sortOrder === "added.desc") {
        return new Date(b.added_at) - new Date(a.added_at);
      }
      if (sortOrder === "added.asc") {
        return new Date(a.added_at) - new Date(b.added_at);
      }
      if (sortOrder === "title.asc") {
        return (a.title || a.name || "").localeCompare(b.title || b.name || "");
      }
      if (sortOrder === "title.desc") {
        return (b.title || b.name || "").localeCompare(a.title || a.name || "");
      }
      if (sortOrder === "rating.desc") {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      if (sortOrder === "rating.asc") {
        return (a.vote_average || 0) - (b.vote_average || 0);
      }
      if (sortOrder === "release.desc") {
        return new Date(b.release_date || b.first_air_date || "9999-12-31") -
               new Date(a.release_date || a.first_air_date || "9999-12-31");
      }
      if (sortOrder === "release.asc") {
        return new Date(a.release_date || a.first_air_date || "0000-01-01") -
               new Date(b.release_date || b.first_air_date || "0000-01-01");
      }
      return 0;
    });
  }, [watchlist, searchQuery, mediaFilter, genreFilter, sortOrder]);

  const handleMediaClick = (media) => {
    setSelectedMedia(media);
    setIsModalOpen(true);
  };

  const handleModalClose = ({ action }) => {
    setIsModalOpen(false);
    setSelectedMedia(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMediaFilter("all");
    setGenreFilter("all");
    setSortOrder("added.desc");
  };

  const genres = [
    { id: "all", name: "All Genres" },
    { id: "28", name: "Action" },
    { id: "12", name: "Adventure" },
    { id: "16", name: "Animation" },
    { id: "35", name: "Comedy" },
    { id: "80", name: "Crime" },
    { id: "99", name: "Documentary" },
    { id: "18", name: "Drama" },
    { id: "10751", name: "Family" },
    { id: "14", name: "Fantasy" },
    { id: "36", name: "History" },
    { id: "27", name: "Horror" },
    { id: "10402", name: "Music" },
    { id: "9648", name: "Mystery" },
    { id: "10749", name: "Romance" },
    { id: "878", name: "Science Fiction" },
    { id: "10770", name: "TV Movie" },
    { id: "53", name: "Thriller" },
    { id: "10752", name: "War" },
    { id: "37", name: "Western" },
  ];

  const mediaTypes = [
    { id: "all", name: "All Types" },
    { id: "movie", name: "Movies" },
    { id: "tv", name: "TV Shows" },
  ];

  const sortOptions = [
    { id: "added.desc", name: "Added (Newest)" },
    { id: "added.asc", name: "Added (Oldest)" },
    { id: "title.asc", name: "Title (A-Z)" },
    { id: "title.desc", name: "Title (Z-A)" },
    { id: "rating.desc", name: "Rating (High-Low)" },
    { id: "rating.asc", name: "Rating (Low-High)" },
    { id: "release.desc", name: "Release (Newest)" },
    { id: "release.asc", name: "Release (Oldest)" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="bg-[#1a1a1a] p-4 sticky top-0 z-10 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Watchlist</h1>
        </div>
      </header>
      <main className="p-4 max-w-7xl mx-auto">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input
            id="watchlist-search"
            className="w-full max-w-md px-4 py-2 rounded bg-[#292929] text-white"
            placeholder="Search your watchlist..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-4">
            <button
              className="flex items-center px-4 py-2 bg-[#3a3a3a] rounded hover:bg-[#4a4a4a]"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              Filters {isFilterOpen ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
            </button>
            {(searchQuery || mediaFilter !== "all" || genreFilter !== "all" || sortOrder !== "added.desc") && (
              <button
                className="flex items-center px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                onClick={clearFilters}
              >
                Clear <Trash2 className="ml-2 w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {isFilterOpen && (
          <div className="mb-4 p-4 bg-[#292929] rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="media-type" className="mr-2">Media Type:</label>
                <select
                  id="media-type"
                  value={mediaFilter}
                  onChange={(e) => setMediaFilter(e.target.value)}
                  className="w-full bg-[#3a3a3a] text-white rounded px-2 py-1"
                >
                  {mediaTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="genre" className="mr-2">Genre:</label>
                <select
                  id="genre"
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="w-full bg-[#3a3a3a] text-white rounded px-2 py-1"
                >
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sort" className="mr-2">Sort By:</label>
                <select
                  id="sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-[#3a3a3a] text-white rounded px-2 py-1"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        <div className="mb-8 p-6 bg-[#292929] rounded-lg text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <Film className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg mb-4">Explore Popular Titles</h2>
          <div className="grid grid-cols-2 gap-4">
            {suggestions.map((s) => (
              <button
                key={s.query}
                title={`Search for ${s.label}`}
                className="px-4 py-2 bg-[#3a3a3a] rounded hover:bg-[#4a4a4a]"
                onClick={() => setSearchQuery(s.query)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-center text-red-500">Error loading watchlist.</p>}
        {!watchlistData && !error && (
          <p className="text-center">Loading...</p>
        )}
        {filteredWatchlist.length === 0 && !error && (
          <p className="text-center">No items in your watchlist match the current filters.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredWatchlist.map((media) => (
            <MovieCard
              key={media.id}
              {...media}
              onClick={() => handleMediaClick(media)}
            />
          ))}
        </div>
        {isModalOpen && selectedMedia && (
          <DetailsModal
            movie={selectedMedia}
            isInWatchlist={isInWatchlist(selectedMedia.id)}
            onClose={handleModalClose}
          />
        )}
      </main>
    </div>
  );
}