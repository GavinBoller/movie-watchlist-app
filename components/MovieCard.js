import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useToast } from './ToastContext';

export default function MovieCard({ result, onAddToWatchlist, onInfoClick }) {
  const router = useRouter();
  const { id, title, name, release_date, first_air_date, poster_path, media_type } = result;
  const displayTitle = title || name;
  const displayDate = release_date || first_air_date;
  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w200${poster_path}`
    : 'https://placehold.co/200x300?text=No+Poster';
  const [imdbId, setImdbId] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchImdbId = async () => {
      try {
        const endpoint =
          media_type === 'movie'
            ? `https://api.themoviedb.org/3/movie/${id}/external_ids`
            : `https://api.themoviedb.org/3/tv/${id}/external_ids`;
        const res = await fetch(`${endpoint}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
        if (!res.ok) throw new Error('Failed to fetch IMDb ID');
        const data = await res.json();
        setImdbId(data.imdb_id || null);
      } catch (error) {
        addToast({
          id: Date.now(),
          title: 'Error',
          description: 'Failed to fetch IMDb ID.',
          variant: 'destructive',
        });
      }
    };

    fetchImdbId();
  }, [id, media_type]);

  const handleAdd = () => {
    onAddToWatchlist(result);
  };

  const imdbUrl = imdbId
    ? `https://www.imdb.com/title/${imdbId}`
    : `https://www.imdb.com/find/?q=${encodeURIComponent(displayTitle)}&s=tt`;

  const handleImdbClick = (e) => {
    e.stopPropagation();
    window.open(imdbUrl, '_blank', 'noopener');
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    onInfoClick(result);
  };

  return (
    <div
      className="relative aspect-[2/3] bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105 animate__animated animate__fadeIn"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster */}
      <img src={posterUrl} alt={displayTitle} className="w-full h-full object-cover" />

      {/* Overlay with Buttons */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-75 transition-opacity duration-300 p-3 ${
          isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-lg font-semibold text-white truncate">{displayTitle}</h3>
          <p className="text-sm text-gray-400">{displayDate ? new Date(displayDate).getFullYear() : 'N/A'}</p>
          <p className="text-sm text-gray-300 capitalize">{media_type}</p>

          {/* Desktop: Horizontal Buttons */}
          <div className="hidden sm:flex mt-2 space-x-2">
            <button
              onClick={handleAdd}
              className="flex-grow text-xs rounded-full py-1 px-3 bg-[#E50914] text-white hover:bg-red-700 transition-colors"
            >
              <span className="mr-1">+</span> Add to Watchlist
            </button>
            <button
              onClick={handleInfoClick}
              className="text-xs rounded-full py-1 px-3 bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <span className="mr-1">ℹ</span> Details
            </button>
            <button
              onClick={handleImdbClick}
              className="text-xs rounded-full py-1 px-3 bg-[#F5C518] text-black hover:bg-yellow-500 transition-colors"
              disabled={!imdbUrl}
            >
              <span className="mr-1">🔗</span> IMDb
            </button>
          </div>

          {/* Mobile: Vertical Buttons */}
          <div className="sm:hidden flex flex-col mt-3 space-y-2">
            <button
              onClick={handleAdd}
              className="text-sm rounded-lg py-2 px-3 bg-[#E50914] text-white hover:bg-red-700 transition-colors"
            >
              <span className="mr-2">+</span> Add to Watchlist
            </button>
            <div className="flex space-x-2">
              <button
                onClick={handleInfoClick}
                className="flex-1 text-sm rounded-lg py-2 bg-gray-700 text-white hover:bg-gray-600 transition-colors text-center"
              >
                <span className="mr-2">ℹ</span> Details
              </button>
              <button
                onClick={handleImdbClick}
                className="flex-1 text-sm rounded-lg py-2 bg-[#F5C518] text-black hover:bg-yellow-500 transition-colors"
                disabled={!imdbUrl}
              >
                <span className="mr-2">🔗</span> IMDb
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
