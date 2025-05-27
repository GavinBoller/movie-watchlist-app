'use client';

import { useState, useEffect } from 'react';
import { Star, Tag, Clock, Tv2, Plus, ExternalLink, X } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ToastContext';

export default function DetailsModal({ item, onClose, onAddToWatchlist }) {
  const [details, setDetails] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchDetails() {
      if (!item) return;
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=external_ids`
        );
        if (!res.ok) throw new Error('Failed to fetch details');
        const data = await res.json();
        setDetails({
          ...data,
          imdb_id: data.external_ids.imdb_id || item.imdb_id,
          runtime: data.runtime || (data.episode_run_time && data.episode_run_time[0]) || null,
          seasons: data.number_of_seasons || null,
          episodes: data.number_of_episodes || null,
          genres: data.genres?.map((g) => g.name).join(', ') || 'N/A',
        });
      } catch (error) {
        console.error('Error fetching details:', error);
        addToast({
          id: Date.now(),
          title: 'Error',
          description: 'Failed to load details',
          variant: 'destructive',
        });
      }
    }
    fetchDetails();
  }, [item]);

  if (!item || !details) {
    console.warn('DetailsModal: No item or details provided');
    return null;
  }

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="relative bg-[#292929] rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundImage: details.backdrop_path
            ? `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(https://image.tmdb.org/t/p/w1280${details.backdrop_path})`
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
            src={`https://image.tmdb.org/t/p/w500${details.poster_path || item.poster || '/placeholder.jpg'}`}
            alt={details.title || details.name || 'Item'}
            className="w-full sm:w-48 h-72 sm:h-auto object-cover rounded-lg mx-auto sm:mx-0"
          />
          <div className="flex-1 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {details.title || details.name || 'Untitled'}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4 text-sm text-gray-300">
              <span>{details.release_date?.split('-')[0] || details.first_air_date?.split('-')[0] || 'N/A'}</span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {details.vote_average?.toFixed(1) || 'N/A'}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {details.genres}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                {details.media_type === 'tv' ? <Tv2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {details.media_type === 'tv'
                  ? `${details.seasons || 'N/A'} seasons, ${details.episodes || 'N/A'} episodes`
                  : formatRuntime(details.runtime)}
              </span>
            </div>
            <p className="text-gray-200 mb-4 max-h-40 overflow-y-auto">
              {details.overview || 'No overview available'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => {
                  onAddToWatchlist();
                  onClose();
                }}
                className="bg-[#E50914] text-white hover:bg-[#f6121d] flex items-center gap-1 py-3 sm:py-2"
              >
                <Plus className="h-4 w-4" />
                Add to Watchlist
              </Button>
              {details.imdb_id ? (
                <a
                  href={`https://www.imdb.com/title/${details.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className="bg-[#F5C518] text-black hover:bg-[#e6b800] flex items-center gap-1 py-3 sm:py-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on IMDb
                  </Button>
                </a>
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