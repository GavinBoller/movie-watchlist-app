// DetailsModal.js

import { PlusCircle, ExternalLink, Star, Clock, Film, Tv } from 'lucide-react';
import { Button } from './ui/button';

const DetailsModal = ({ item, onClose, onAddToWatchlist }) => {
  // This is a "guard clause". If for any reason the item is not available,
  // it will prevent the component from crashing by rendering nothing.
  if (!item) {
    return null;
  }

  const posterUrl = item.poster
    ? `https://image.tmdb.org/t/p/w500${item.poster}`
    : 'https://placehold.co/500x750?text=No+Image';

  const handleAddToWatchlistClick = () => {
    onAddToWatchlist(item);
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
          className="absolute top-3 right-3 text-gray-400 hover:text-white z-10"
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <img
              src={posterUrl}
              alt={item.title || item.name}
              className="w-48 h-auto rounded-lg object-cover mx-auto"
            />
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-2">{item.title || item.name}</h2>
            <p className="text-gray-300 text-sm mb-2">
              {(item.release_date || item.first_air_date || '').split('-')[0]}
              {item.genres && ` • ${item.genres}`}
            </p>
            {item.vote_average > 0 && (
              <div className="flex items-center text-[#F5C518] mb-2">
                <Star className="h-5 w-5 fill-current mr-1" />
                <span className="font-bold">{item.vote_average.toFixed(1)}</span>
              </div>
            )}
            <p className="text-gray-200 text-sm mb-4">{item.overview || 'No overview available.'}</p>

            {item.media_type === 'tv' && (
              <div className="text-gray-300 text-sm mb-2 space-y-1">
                <p><strong>Seasons:</strong> {item.number_of_seasons || 'N/A'}</p>
                <p><strong>Episodes:</strong> {item.number_of_episodes || 'N/A'}</p>
              </div>
            )}
            {item.media_type === 'movie' && item.runtime > 0 && (
              <div className="text-gray-300 text-sm mb-2">
                <p><strong>Runtime:</strong> {Math.floor(item.runtime / 60)}h {item.runtime % 60}m</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {item.imdb_id && (
                <Button
                  asChild
                  className="bg-[#F5C518] text-black hover:bg-yellow-400"
                >
                  <a
                    href={`https://www.imdb.com/title/${item.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    IMDb
                  </a>
                </Button>
              )}
              <Button
                onClick={handleAddToWatchlistClick}
                className="bg-[#E50914] hover:bg-red-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add to Watchlist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
