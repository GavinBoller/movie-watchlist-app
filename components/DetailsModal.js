'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Star, Clock, Tv2, Clapperboard, PlusCircle, Tag, ExternalLink } from 'lucide-react';
import { useToast, useWatchlist } from './ToastContext';

export default function DetailsModal({ item, onClose, onAddToWatchlist }) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { addToast } = useToast();
  const { watchlist, isLoading: watchlistLoading, error: watchlistError } = useWatchlist();

  useEffect(() => {
    console.log('DetailsModal item:', item);
    console.log('Poster path:', item?.poster_path);
    setIsLoading(watchlistLoading);
    if (!watchlistLoading && Array.isArray(watchlist)) {
      console.log('Watchlist data:', watchlist.map((w) => ({ movie_id: w.movie_id, title: w.title })));
      const inWatchlist = watchlist.some((watchlistItem) => 
        watchlistItem.movie_id === item.id.toString()
      );
      setIsInWatchlist(inWatchlist);
      console.log(`Item ${item.id} isInWatchlist:`, inWatchlist);
    }
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [item?.id, watchlist, watchlistLoading]);

  if (!item) {
    console.warn('DetailsModal: item is undefined');
    return null;
  }

  if (watchlistError) {
    addToast({
      id: Date.now(),
      title: 'Error',
      description: 'Failed to load watchlist data',
      variant: 'destructive',
    });
  }

  const title = item.title || item.name || 'Unknown';
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : 'https://placehold.co/300x450?text=No+Image';
  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
    : null;
  const voteAverage = item.vote_average && !isNaN(item.vote_average)
    ? parseFloat(item.vote_average).toFixed(1)
    : 'N/A';
  const runtime = item.runtime
    ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
    : item.episode_run_time && item.episode_run_time[0]
    ? `${item.episode_run_time[0]}m`
    : 'N/A';
  const seasons = item.media_type === 'tv' ? (item.number_of_seasons || 'N/A') : null;
  const episodes = item.media_type === 'tv' ? (item.number_of_episodes || 'N/A') : null;
  const genres = Array.isArray(item.genres) ? item.genres.join(', ') : item.genres || 'N/A';
  const year = (item.release_date || item.first_air_date)?.split('-')[0] || 'N/A';

  const handleImdbLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.imdb_id) {
      window.open(`https://www.imdb.com/title/${item.imdb_id}`, '_blank', 'noopener,noreferrer');
    } else {
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'No IMDb link available',
        variant: 'destructive',
      });
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (isInWatchlist) {
      addToast({
        id: Date.now(),
        title: 'Info',
        description: `${title} is already in your watchlist`,
      });
      onClose();
      return;
    }
    onAddToWatchlist();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="relative bg-[#292929] rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundImage: backdropUrl
            ? `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${backdropUrl})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex flex-col sm:flex-row p-6 gap-6">
          <img
            src={posterUrl}
            alt={title}
            className="w-full sm:w-48 h-72 sm:h-auto object-cover rounded-lg mx-auto sm:mx-0"
            loading="lazy"
          />
          <div className="flex-1 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h2>
            <div className="flex flex-wrap gap-2 mb-4 text-sm text-gray-300">
              <span>{year}</span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {voteAverage}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {genres}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                {item.media_type === 'tv' ? <Tv2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {item.media_type === 'tv'
                  ? `${seasons} season${seasons !== 1 ? 's' : ''}, ${episodes} episode${episodes !== 1 ? 's' : ''}`
                  : runtime}
              </span>
            </div>
            <p className="text-gray-200 mb-4 max-h-40 overflow-y-auto">
              {item.overview || 'No overview available'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {!isLoading && !isInWatchlist && (
                <Button
                  onClick={handleAddClick}
                  className="bg-[#E50914] text-white hover:bg-[#f6121d] flex items-center gap-1 py-3 sm:py-2"
                  disabled={isLoading}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add to Watchlist
                </Button>
              )}
              {item.imdb_id ? (
                <Button
                  asChild
                  className="bg-[#F5C518] text-black hover:bg-[#e6b800] flex items-center gap-1 py-3 sm:py-2 touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                >
                  <a
                    href={`https://www.imdb.com/title/${item.imdb_id}`}
                    onClick={handleImdbLink}
                    onTouchStart={handleImdbLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on IMDb
                  </a>
                </Button>
              ) : (
                <Button
                  disabled
                  className="bg-gray-600 text-gray-400 flex items-center gap-1 py-3 sm:py-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  IMDb (N/A)
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}