import { useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { Star } from 'lucide-react';

export default function MovieCard({ result, onAddToWatchlist, onInfoClick, isInWatchlist }) {
  const { id, title, name, release_date, first_air_date, poster_path, media_type, vote_average, genre_ids, genres, runtime, number_of_seasons, number_of_episodes } = result;
  const displayTitle = title || name || 'Untitled';
  const displayDate = release_date || first_air_date;
  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w200${poster_path}`
    : '/placeholder-image.svg';
  const [imdbId, setImdbId] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const { addToast } = useToast();

  const badgeClass = media_type === 'tv' ? 'bg-blue-600' : 'bg-[#E50914]';
  const typeBadge = media_type === 'tv' ? 'TV' : 'Movie';
  const displayGenres = genres?.join(', ') || (genre_ids?.map(id => {
    const genresMap = media_type === 'tv' ? {
      10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
      18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery', 10763: 'News',
      10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk',
      10768: 'War & Politics', 37: 'Western'
    } : {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
      99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
      27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
      10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
    };
    return genresMap[id];
  }).filter(Boolean).join(', ')) || 'N/A';
  const displayInfo = displayDate
    ? `${new Date(displayDate).getFullYear()} • ${displayGenres}${runtime ? ` • ${runtime}m` : ''}${number_of_seasons ? ` • ${number_of_seasons} Season${number_of_seasons > 1 ? 's' : ''}` : ''}${number_of_episodes ? ` • ${number_of_episodes} Episode${number_of_episodes > 1 ? 's' : ''}` : ''}`
    : `N/A • ${displayGenres}`;

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
  }, [id, media_type, addToast]);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!isInWatchlist) {
      onAddToWatchlist(result);
    }
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
      <img 
        src={posterUrl} 
        alt={displayTitle} 
        className="w-full h-full object-cover" 
        onError={(e) => {
          e.target.src = '/placeholder-image.svg';
        }}
      />
      {/* Badge */}
      <div className={`absolute top-2 right-2 ${badgeClass} text-white text-xs font-bold py-1 px-2 rounded-full`}>
        {typeBadge}
      </div>
      {/* Overlay with Buttons */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-75 transition-opacity duration-300 p-3 ${
          isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-lg font-semibold text-white truncate">{displayTitle}</h3>
          <p className="text-sm text-gray-400">{displayInfo}</p>
          <div className="flex items-center mt-1">
            {vote_average && (
              <>
                <span className="text-[#F5C518] text-sm">{vote_average.toFixed(1)}</span>
                <Star className="h-3 w-3 text-[#F5C518] fill-current ml-1" />
              </>
            )}
          </div>
          {/* Desktop: Horizontal Buttons */}
          <div className="hidden sm:flex mt-2 space-x-2">
            {!isInWatchlist && (
              <button
                onClick={handleAdd}
                className="flex-grow text-xs rounded-full py-1 px-3 bg-[#E50914] text-white hover:bg-red-700 transition-colors"
              >
                <span className="mr-1">+</span> Add to Watchlist
              </button>
            )}
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
            {!isInWatchlist && (
              <button
                onClick={handleAdd}
                className="text-sm rounded-lg py-2 px-3 bg-[#E50914] text-white hover:bg-red-700 transition-colors"
              >
                <span className="mr-2">+</span> Add to Watchlist
              </button>
            )}
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