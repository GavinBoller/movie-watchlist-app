'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Star, Clock, Tv2, Clapperboard, PlusCircle, Tag, ExternalLink } from 'lucide-react';
import { useToast, useWatchlist } from './ToastContext';

export default function DetailsModal({ item, onClose, onAddToWatchlist }) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { watchlist, isLoading: watchlistLoading } = useWatchlist();

  useEffect(() => {
    console.log('DetailsModal item:', item);
    console.log('Poster path:', item?.poster_path);
    setIsLoading(watchlistLoading);
    setIsInWatchlist(watchlist.some((watchlistItem) => 
      watchlistItem.movie_id === item.id.toString() || 
      watchlistItem.movie_id === item.id
    ));
  }, [item?.id, watchlist, watchlistLoading]);

  if (!item) return null;

  const title = item.title || item.name || 'Unknown';
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';
  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
    : null;
  const displayInfo = item.release_date
    ? `${item.release_date.split('-')[0]} • ${item.genres || 'N/A'}`
    : 'N/A';
  const voteAverage = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  const runtime = item.runtime
    ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
    : item.episode_run_time && item.episode_run_time[0]
    ? `${item.episode_run_time[0]}m`
    : 'N/A';
  const seasons = item.media_type === 'tv' ? (item.number_of_seasons || 'N/A') : null;
  const episodes = item.media_type === 'tv' ? (item.number_of_episodes || 'N/A') : null;

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
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex flex-col sm:flex-row p-6 gap-6">
          <img
            src={posterUrl}
            alt={title}
            className="w-full sm:w-48 h-72 sm:h-auto object-cover rounded-lg mx-auto sm:mx-0"
          />
          <div className="flex-1 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h2>
            <div className="flex flex-wrap gap-2 mb-4 text-sm text-gray-300">
              <span>{item.release_date?.split('-')[0] || 'N/A'}</span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {voteAverage}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {item.genres || 'N/A'}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                {item.media_type === 'tv' ? <Tv2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {item.media_type === 'tv'
                  ? `${seasons} seasons, ${episodes} episodes`
                  : runtime}
              </span>
            </div>
            <p className="text-gray-200 mb-4 max-h-40 overflow-y-auto">
              {item.overview || 'No overview available'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {!isLoading && !isInWatchlist && (
                <Button
                  onClick={() => {
                    onAddToWatchlist();
                    onClose();
                  }}
                  className="bg-[#E50914] text-white hover:bg-[#f6121d] flex items-center gap-1 py-3 sm:py-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add to Watchlist
                </Button>
              )}
              {item.imdb_id ? (
                <Button
                  asChild
                  className="bg-[#F5C518] text-black hover:bg-[#e6b800] flex items-center gap-1 py-3 sm:py-2"
                >
                  <a
                    href={`https://www.imdb.com/title/${item.imdb_id}`}
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