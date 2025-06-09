import Image from 'next/image';
import { X } from 'lucide-react';
import { useToast } from './ToastContext';

export default function DetailsModal({ movie, isInWatchlist, onClose }) {
  const { addToWatchlist, removeFromWatchlist } = useToast();

  const handleAction = async (action) => {
    if (action === 'add') {
      await addToWatchlist(movie);
    } else if (action === 'remove') {
      await removeFromWatchlist(movie.id);
    }
    onClose({ action });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-lg w-full relative">
        <button
          className="absolute top-2 right-2 text-white hover:text-gray-300"
          onClick={() => onClose({ action: 'close' })}
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={movie.poster || 'https://via.placeholder.com/300x450?text=No+Image'}
          alt={movie.title || 'No image'}
          width={300}
          height={450}
          className="mx-auto mb-4 rounded"
        />
        <h2 className="text-2xl font-bold mb-2">{movie.title}</h2>
        <p className="mb-4 text-gray-300">{movie.overview || 'No description available'}</p>
        <div className="flex justify-between mb-4 text-sm">
          <span>Release: {movie.release_date || movie.first_air_date || 'N/A'}</span>
          <span>Rating: {movie.vote_average ? `${movie.vote_average}/10` : 'N/A'}</span>
        </div>
        <div className="flex justify-between mb-4 text-sm">
          <span>Genre: {movie.genre_ids?.join(', ') || 'N/A'}</span>
          <span>Media: {movie.media_type || 'N/A'}</span>
        </div>
        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={() => handleAction(isInWatchlist ? 'remove' : 'add')}
          >
            {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
          <button
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
            onClick={() => onClose({ action: 'close' })}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}