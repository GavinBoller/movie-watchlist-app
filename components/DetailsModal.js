// DetailsModal.js
import React, { useEffect } from 'react';
import useSWR from 'swr';
import { PlusCircle, ExternalLink, Star, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import WhereToWatch from './WhereToWatch';

const fetcher = (url) => fetch(url).then((res) => res.json());

const DetailsModal = ({ item, onClose, onAddToWatchlist, isInWatchlist }) => {
  // Fetch all details, including country-specific watch providers, from our new API endpoint
  const { data: details, error } = useSWR(
    item ? `/api/details?id=${item.id}&media_type=${item.media_type}` : null,
    fetcher
  );

  const isLoading = !details && !error;
  const providers = details?.watch_providers;

  // This is a "guard clause". If for any reason the initial item is not available,
  // it will prevent the component from crashing by rendering nothing.
  if (!item) {
    return null;
  }

  // Effect to handle Escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]); // Re-run effect if onClose changes

  const posterUrl = details?.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : 'https://placehold.co/500x750?text=No+Image';

  const handleAddToWatchlistClick = () => {
    onAddToWatchlist(details || item); // Use detailed data if available
    onClose(); // Close this modal after initiating the add process
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose} // Close modal if clicking on the background
    >
      <div
        className="bg-[#1a1a1a] rounded-lg shadow-lg max-w-3xl w-full p-6 relative text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-[#E50914]" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400">Failed to load details.</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={posterUrl}
                alt={details.title || details.name}
                className="w-48 h-auto rounded-lg object-cover mx-auto"
              />
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold mb-2">{details.title || details.name}</h2>
              <p className="text-gray-300 text-sm mb-2">
                {(details.release_date || details.first_air_date || '').split('-')[0]}
                {details.genres && ` • ${details.genres.map(g => g.name).join(', ')}`}
              </p>
              {details.vote_average > 0 && (
                <div className="flex items-center text-[#F5C518] mb-2">
                  <Star className="h-5 w-5 fill-current mr-1" />
                  <span className="font-bold">{details.vote_average.toFixed(1)}</span>
                </div>
              )}
              <p className="text-gray-200 text-sm mb-4">{details.overview || 'No overview available.'}</p>

              {details.media_type === 'tv' && (
                <div className="text-gray-300 text-sm mb-2 space-y-1">
                  <p><strong>Seasons:</strong> {details.number_of_seasons || 'N/A'}</p>
                  <p><strong>Episodes:</strong> {details.number_of_episodes || 'N/A'}</p>
                </div>
              )}
              {details.media_type === 'movie' && details.runtime > 0 && (
                <div className="text-gray-300 text-sm mb-2">
                  <p><strong>Runtime:</strong> {Math.floor(details.runtime / 60)}h {details.runtime % 60}m</p>
                </div>
              )}

              <WhereToWatch providers={providers} isLoading={false} />

              <div className="flex flex-wrap gap-2 mt-4">
                {details.external_ids?.imdb_id && (
                  <Button
                    asChild
                    className="bg-[#F5C518] text-black hover:bg-yellow-400"
                  >
                    <a
                      href={`https://www.imdb.com/title/${details.external_ids.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      IMDb
                    </a>
                  </Button>
                )}
                {!isInWatchlist && (
                  <Button
                    onClick={handleAddToWatchlistClick}
                    className="bg-[#E50914] hover:bg-red-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add to Watchlist
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsModal;
