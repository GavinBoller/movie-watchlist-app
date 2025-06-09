'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { PlusCircle, ExternalLink, Star, Clapperboard, Tv2, List, Film, Tv } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import MovieCard from '../components/MovieCard';
import DetailsModal from '../components/DetailsModal';
import AddToWatchlistModal from '../components/AddToWatchlistModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

const movieGenres = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const tvGenres = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [addItem, setAddItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { addToast } = useToast();
  const limit = 20;

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

  const { data, error } = useSWR(
    debouncedSearch
      ? `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(debouncedSearch)}&page=${page}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch watchlist
  const { data: watchlistData } = useSWR(
    '/api/watchlist?page=1&limit=1000',
    fetcher,
    { revalidateOnFocus: false, revalidateOnMount: true }
  );
  const watchlistIds = watchlistData?.items?.map(item => item.movie_id) || [];

  // Enhance search results with TMDB details (e.g., imdb_id)
  const [enhancedResults, setEnhancedResults] = useState([]);

  useEffect(() => {
    const enhanceResults = async () => {
      if (!data?.results) return;

      const filteredResults = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
      const enhanced = await Promise.all(
        filteredResults.map(async (item) => {
          try {
            const detailUrl = `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=external_ids`;
            const details = await fetchTmdb(detailUrl);
            return {
              ...item,
              imdb_id: details.external_ids?.imdb_id || null,
              genres: details.genres?.map(g => g.name) || item.genre_ids?.map(id => (item.media_type === 'tv' ? tvGenres : movieGenres)[id]).filter(Boolean) || [],
              runtime: details.runtime || null,
              number_of_seasons: details.number_of_seasons || null,
              number_of_episodes: details.number_of_episodes || null,
            };
          } catch (error) {
            console.warn(`Failed to fetch TMDB details for ${item.id}:`, error);
            return item;
          }
        })
      );
      setEnhancedResults(enhanced);
    };
    enhanceResults();
  }, [data?.results]);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (data) {
      console.log(`Search query "${debouncedSearch}" page ${page} returned ${data.results?.length || 0} results, total: ${data.total_results}, pages: ${data.total_pages}`);
    }
  }, [data, debouncedSearch, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, mediaFilter]);

  const handleAdd = async (item) => {
    try {
      const detailUrl = `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=external_ids`;
      const details = await fetchTmdb(detailUrl);
      const genresMap = item.media_type === 'tv' ? tvGenres : movieGenres;
      setAddItem({
        id: item.id.toString(),
        title: item.title || item.name,
        media_type: item.media_type || 'movie',
        poster_path: item.poster_path,
        overview: item.overview,
        release_date: item.release_date || item.first_air_date,
        imdb_id: details.external_ids?.imdb_id || null,
        vote_average: item.vote_average,
        genres: item.genre_ids
          ? item.genre_ids.map(id => genresMap[id]).filter(Boolean).join(', ')
          : details.genres?.map(g => g.name).join(', ') || '',
        runtime: details.runtime || null,
        number_of_seasons: details.number_of_seasons || null,
        number_of_episodes: details.number_of_episodes || null,
      });
      // Revalidate watchlist after adding
      mutate('/api/watchlist?page=1&limit=1000');
    } catch (error) {
      console.error('Error fetching TMDB details:', error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to load item details',
        variant: 'destructive',
      });
    }
  };

  const handleInfoClick = (item) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleSave = async (payload) => {
    // No additional logic needed here; handled by AddToWatchlistModal
    mutate('/api/watchlist?page=1&limit=1000');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header />
        <div className="container mx-auto p-4 text-center">
          <p className="text-gray-300">Failed to load search results: {error.message}</p>
        </div>
      </div>
    );
  }

  const results = enhancedResults
    .filter(item => mediaFilter === 'all' || item.media_type === mediaFilter);
  const totalPages = data?.total_pages || 1;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Search Movies & TV Shows</h1>
        <div className="mb-4 flex justify-center">
          <Input
            type="text"
            placeholder="Search for a movie or TV show..."
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
            All
          </Button>
          <Button
            onClick={() => setMediaFilter('movie')}
            className={`flex items-center gap-1 ${mediaFilter === 'movie' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Film className="h-4 w-4" />
            Movies
          </Button>
          <Button
            onClick={() => setMediaFilter('tv')}
            className={`flex items-center gap-1 ${mediaFilter === 'tv' ? 'bg-[#E50914] hover:bg-[#f6121d]' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Tv className="h-4 w-4" />
            TV Shows
          </Button>
        </div>
        {!data && debouncedSearch ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="w-full aspect-[2/3] bg-gray-800" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300">No results found. Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {results.map((item) => (
              <MovieCard
                key={item.id}
                result={item}
                onAddToWatchlist={handleAdd}
                onInfoClick={handleInfoClick}
                isInWatchlist={watchlistIds.includes(item.id.toString())}
              />
            ))}
          </div>
        )}
        {results.length > 0 && (
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
        )}
      </div>
      {addItem && (
        <AddToWatchlistModal
          item={addItem}
          onSave={handleSave}
          onClose={() => setAddItem(null)}
        />
      )}
      {isDetailsOpen && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setIsDetailsOpen(false)}
          onAddToWatchlist={handleAdd}
        />
      )}
    </div>
  );
}