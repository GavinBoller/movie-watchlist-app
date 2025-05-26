import { useState, useEffect } from 'react';
import { X, Star, Film, Tv2, Clock, PlayCircle } from 'lucide-react';
import { useToast } from './ToastContext';

export default function DetailsModal({ item, onClose, onAddToWatchlist }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const { id, title, name, release_date, first_air_date, poster_path, media_type, overview } = item;
  const displayTitle = title || name;
  const displayDate = release_date || first_air_date;
  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : 'https://placehold.co/500x750?text=No+Poster';

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const endpoint =
          media_type === 'movie'
            ? `https://api.themoviedb.org/3/movie/${id}`
            : `https://api.themoviedb.org/3/tv/${id}`;
        const res = await fetch(`${endpoint}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
        if (!res.ok) throw new Error('Failed to fetch details');
        const data = await res.json();
        setDetails(data);
      } catch (error) {
        addToast({
          id: Date.now(),
          title: 'Error',
          description: 'Failed to fetch movie details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, media_type]);

  const handleAdd = () => {
    onAddToWatchlist(item);
    onClose(); // Close modal after adding
  };

  const imdbUrl = details?.imdb_id
    ? `https://www.imdb.com/title/${details.imdb_id}`
    : `https://www.imdb.com/find/?q=${encodeURIComponent(displayTitle)}&s=tt`;

  const handleImdbClick = () => {
    window.open(imdbUrl, '_blank', 'noopener');
  };

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#292929] rounded-lg p-6 w-[90%] max-w-2xl">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#292929] rounded-lg p-6 w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{displayTitle}</h2>
            <p className="text-gray-400">
              {displayDate ? new Date(displayDate).getFullYear() : 'N/A'}
              {details?.vote_average && (
                <>
                  {' • '}
                  <Star className="inline h-4 w-4 text-yellow-400" /> {details.vote_average.toFixed(1)}
                </>
              )}
              {media_type === 'movie' && details?.runtime && (
                <>
                  {' • '}
                  <Clock className="inline h-4 w-4" /> {formatRuntime(details.runtime)}
                </>
              )}
              {media_type === 'tv' && details?.number_of_seasons && (
                <>
                  {' • '}
                  <PlayCircle className="inline h-4 w-4" /> {details.number_of_seasons} season{details.number_of_seasons > 1 ? 's' : ''}, {details.number_of_episodes} episode{details.number_of_episodes > 1 ? 's' : ''}
                </>
              )}
              {details?.genres && (
                <>
                  {' • '}
                  {details.genres.map((genre) => genre.name).join(', ')}
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <img
            src={posterUrl}
            alt={displayTitle}
            className="w-full md:w-1/3 max-h-48 md:max-h-none object-cover rounded-lg mx-auto md:mx-0"
          />

          {/* Details */}
          <div className="flex-1 text-white">
            <p className="mb-4 flex items-center">
              {media_type === 'movie' ? (
                <>
                  <Film className="h-4 w-4 mr-2" /> Movie
                </>
              ) : (
                <>
                  <Tv2 className="h-4 w-4 mr-2" /> TV Show
                </>
              )}
            </p>
            <p className="mb-4 text-gray-300">{overview || 'No overview available.'}</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAdd}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-[#E50914] text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <span className="mr-2">+</span> Add to Watchlist
              </button>
              <button
                onClick={handleImdbClick}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-[#F5C518] text-black rounded hover:bg-yellow-500 transition-colors flex items-center justify-center"
              >
                <span className="mr-2">🔗</span> View on IMDb
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
