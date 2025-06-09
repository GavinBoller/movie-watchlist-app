import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '../utils/fetcher';
import MovieCard from '../components/MovieCard';
import Input from '../components/Input';
import { Film } from 'lucide-react';
import { useDebounce } from 'use-debounce';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('popularity.desc');
  const [debouncedSearch] = useDebounce(searchQuery.trim(), 500);

  const suggestions = [
    { query: 'Marvel', label: 'Try Marvel' },
    { query: 'Star Wars', label: 'Try Star Wars' },
    { query: 'Breaking Bad', label: 'Try Breaking Bad' },
    { query: 'Stranger Things', label: 'Try Stranger Things' },
  ];

  const apiUrl = useMemo(() => {
    let url = debouncedSearch
      ? `/api/search?query=${encodeURIComponent(debouncedSearch)}`
      : '/api/watchlist?limit=50';
    if (mediaFilter !== 'all') {
      url += `&media_type=${mediaFilter}`;
    }
    if (genreFilter !== 'all') {
      url += `&genre=${genreFilter}`;
    }
    if (sortOrder) {
      url += `&sort_by=${sortOrder}`;
    }
    return url;
  }, [debouncedSearch, mediaFilter, genreFilter, sortOrder]);

  const { data: movies, error } = useSWR(apiUrl, fetcher);

  const genres = [
    { id: 'all', name: 'All Genres' },
    { id: '28', name: 'Action' },
    { id: '12', name: 'Adventure' },
    { id: '16', name: 'Animation' },
    { id: '35', name: 'Comedy' },
    { id: '80', name: 'Crime' },
    { id: '99', name: 'Documentary' },
    { id: '18', name: 'Drama' },
    { id: '10751', name: 'Family' },
    { id: '14', name: 'Fantasy' },
    { id: '36', name: 'History' },
    { id: '27', name: 'Horror' },
    { id: '10402', name: 'Music' },
    { id: '9648', name: 'Mystery' },
    { id: '10749', name: 'Romance' },
    { id: '878', name: 'Science Fiction' },
    { id: '10770', name: 'TV Movie' },
    { id: '53', name: 'Thriller' },
    { id: '10752', name: 'War' },
    { id: '37', name: 'Western' },
  ];

  const mediaTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'movie', name: 'Movies' },
    { id: 'tv', name: 'TV Shows' },
  ];

 –

  const sortOptions = [
    { id: 'popularity.desc', name: 'Popularity Descending' },
    { id: 'popularity.asc', name: 'Popularity Ascending' },
    { id: 'vote_average.desc', name: 'Rating Descending' },
    { id: 'vote_average.asc', name: 'Rating Ascending' },
    { id: 'release_date.desc', name: 'Release Date Descending' },
    { id: 'release_date.asc', name: 'Release Date Ascending' },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="bg-[#1a1a1a] p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <Input
            id="search-input"
            className="w-full max-w-md mx-auto px-4 py-2 rounded bg-[#292929] text-white"
            placeholder="Search movies or TV shows..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            <div>
              <label htmlFor="media-type" className="mr-2">Media Type:</label>
              <select
                id="media-type"
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value)}
                className="bg-[#292929] text-white rounded px-2 py-1"
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
                className="bg-[#292929] text-white rounded px-2 py-1"
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
                className="bg-[#292929] text-white rounded px-2 py-1"
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
      </header>
      <main className="p-4 max-w-7xl mx-auto">
        {!debouncedSearch && (
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
        )}
        {error && <p className="text-center text-red-500">Error loading data.</p>}
        {!movies && !error && (
          <p className="text-center">Loading...</p>
        )}
        {movies?.data?.length === 0 && !error && (
          <p className="text-center">No results found.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies?.data?.map((media) => (
            <MovieCard key={media.id} {...media} />
          ))}
        </div>
      </main>
    </div>
  );
}