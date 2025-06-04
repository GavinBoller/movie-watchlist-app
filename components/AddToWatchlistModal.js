'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { CalendarIcon, Clapperboard, Tv2, X, PlayCircle, CheckCircle, Clock, Star } from 'lucide-react';
import { useToast } from './ToastContext';

export default function AddToWatchlistModal({ item, onSave, onClose }) {
  if (!item) {
    console.warn('AddToWatchlistModal: item is undefined');
    return null;
  }

  const [status, setStatus] = useState(item?.status || 'to_watch');
  const [watchedDate, setWatchedDate] = useState(item?.watched_date || '');
  const [selectedPlatformId, setSelectedPlatformId] = useState('none');
  const [notes, setNotes] = useState(item?.notes || '');
  const [platforms, setPlatforms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlatformsLoading, setIsPlatformsLoading] = useState(true);
  const { addToast } = useToast();

  const userId = 1;
  const mediaTypeLabel = item?.media_type === 'tv' ? 'Show' : 'Movie';
  const title = item.title || item.name || 'Untitled';
  const movieId = item.movie_id || item.id?.toString();
  const watchlistId = item.watchlistId?.toString() || null;
  const displayInfo = item?.release_date || item?.first_air_date
    ? `${(item.release_date || item.first_air_date).split('-')[0]} • ${item.genres || 'N/A'}`
    : 'N/A';

  useEffect(() => {
    console.log('AddToWatchlistModal item:', { movie_id: movieId, title, watchlistId });
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [movieId, title, watchlistId]);

  useEffect(() => {
    if (status === 'watched' && !watchedDate) {
      const today = new Date().toISOString().split('T')[0];
      setWatchedDate(today);
    } else if (status !== 'watched' && watchedDate) {
      setWatchedDate('');
    }
  }, [status]);

  useEffect(() => {
    async function fetchPlatforms() {
      setIsPlatformsLoading(true);
      try {
        const res = await fetch(`/api/platforms?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch platforms');
        const data = await res.json();
        const sortedPlatforms = data.sort((a, b) => {
          if (a.is_default) return -1;
          if (b.is_default) return 1;
          return a.name.localeCompare(b.name);
        });
        setPlatforms(sortedPlatforms);

        if (item?.platform) {
          const platform = sortedPlatforms.find((p) => p.name === item.platform);
          setSelectedPlatformId(platform ? platform.id.toString() : 'none');
        } else {
          const defaultPlatform = sortedPlatforms.find((p) => p.is_default);
          setSelectedPlatformId(defaultPlatform ? defaultPlatform.id.toString() : 'none');
        }
      } catch (error) {
        console.error('Error fetching platforms:', error);
        addToast({
          id: Date.now(),
          title: 'Error',
          description: 'Failed to load platforms. Please try again.',
          variant: 'destructive',
        });
        setPlatforms([]);
      } finally {
        setIsPlatformsLoading(false);
      }
    }
    fetchPlatforms();
  }, [item?.platform, userId, addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'watched' && !watchedDate) {
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Please select a watched date',
        variant: 'destructive',
      });
      return;
    }
    if (!movieId || !title || !userId) {
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Movie ID, title, and user are required',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    const payload = {
      id: watchlistId,
      movie_id: movieId,
      title,
      user_id: userId,
      media_type: item.media_type || 'movie',
      status,
      platform: platforms.find((p) => p.id.toString() === selectedPlatformId)?.name || '',
      watched_date: status === 'watched' ? watchedDate : null,
      notes: notes || '',
      poster: item.poster_path || item.poster || '',
      overview: item.overview || null,
      release_date: item.release_date || item.first_air_date || null,
      imdb_id: item.imdb_id || null,
      vote_average: item.vote_average || null,
      runtime: item.runtime || null,
      seasons: item.number_of_seasons || item.seasons || null,
      episodes: item.number_of_episodes || item.episodes || null,
    };

    try {
      const isEdit = !!watchlistId;
      const method = isEdit ? 'PUT' : 'POST';
      console.log(`Submitting ${method} to watchlist:`, payload);

      const response = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEdit ? 'update' : 'save to'} watchlist`);
      }

      await onSave(payload);
      addToast({
        id: Date.now(),
        title: 'Success',
        description: isEdit ? 'Item updated' : 'Added to watchlist',
        variant: 'default',
      });
      onClose();
    } catch (error) {
      console.error(`Error ${watchlistId ? 'updating' : 'saving to'} watchlist:`, error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: error.message || `Failed to ${watchlistId ? 'update' : 'save to'} watchlist`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const posterUrl = item.poster_path || item.poster
    ? `https://image.tmdb.org/t/p/w${isMobile ? '185' : '154'}${item.poster_path || item.poster}`
    : 'https://via.placeholder.com/154x231?text=No+Image';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-[#1a1a1a] rounded-lg relative ${isMobile ? 'p-4 w-[90vw] max-h-[90vh] overflow-y-auto' : 'p-6 max-w-md w-full'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="pr-6">
          <h2 className="text-lg font-bold text-white">
            {status === 'to_watch'
              ? 'Add to Watchlist'
              : status === 'watching'
              ? 'Add to Currently Watching'
              : 'Add to Watched'}
          </h2>
          <p className="text-gray-400 text-sm">
            Add this {mediaTypeLabel.toLowerCase()} to your{' '}
            {status === 'to_watch' ? 'watchlist' : status === 'watching' ? 'watching' : 'watched'} list
          </p>
        </div>
        <div className={isMobile ? 'flex flex-col mb-4' : 'flex mb-4'}>
          <div className={isMobile ? 'relative mx-auto mb-3' : 'relative'}>
            <img
              src={posterUrl}
              alt={title}
              className={`rounded ${isMobile ? 'h-36' : 'w-24'}`}
              loading="lazy"
            />
            <div
              className={`absolute top-2 right-2 text-white text-xs font-bold py-1 px-2 rounded-full ${
                item.media_type === 'tv' ? 'bg-blue-600' : 'bg-[#E50914]'
              }`}
            >
              {item.media_type === 'tv' ? 'TV' : 'Movie'}
            </div>
          </div>
          <div className={isMobile ? 'text-center' : 'ml-4'}>
            <h4 className="font-bold text-lg text-white">{title}</h4>
            <div
              className={`flex items-center text-sm text-gray-300 ${isMobile ? 'justify-center' : ''}`}
            >
              {item.media_type === 'tv' ? (
                <Tv2 className="h-3 w-3 mr-1" />
              ) : (
                <Clapperboard className="h-3 w-3 mr-1" />
              )}
              <span>{displayInfo}</span>
            </div>
            <div className={`flex items-center mt-1 ${isMobile ? 'justify-center' : ''}`}>
              <span className="text-[#F5C518] font-bold text-sm">
                {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
              </span>
              <Star className="h-4 w-4 text-[#F5C518] fill-current ml-1" />
            </div>
          </div>
        </div>
        <div className="mb-4 bg-gray-800 rounded-lg p-3">
          <h5 className="text-sm font-medium text-white mb-1">Overview</h5>
          <p
            className={`text-xs text-gray-300 ${isMobile ? 'max-h-16' : 'max-h-20'} overflow-y-auto`}
          >
            {item.overview || 'No overview available.'}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <RadioGroup value={status} onValueChange={setStatus} className="space-y-2 mb-4">
            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer">
              <RadioGroupItem value="to_watch" id="status-to-watch" />
              <Label
                htmlFor="status-to-watch"
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <Clock className="h-4 w-4 text-blue-400" />
                <div>
                  <div className="font-medium text-white">To Watch</div>
                  <div className="text-xs text-gray-400">Save for later</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer">
              <RadioGroupItem value="watching" id="status-watching" />
              <Label
                htmlFor="status-watching"
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <PlayCircle className="h-4 w-4 text-green-400" />
                <div>
                  <div className="font-medium text-white">Currently Watching</div>
                  <div className="text-xs text-gray-400">Started but not finished</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer">
              <RadioGroupItem value="watched" id="status-watched" />
              <Label
                htmlFor="status-watched"
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <CheckCircle className="h-4 w-4 text-[#E50914]" />
                <div>
                  <div className="font-medium text-white">Watched</div>
                  <div className="text-xs text-gray-400">Already watched</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
          {status === 'watched' && (
            <div className="mb-4">
              <Label htmlFor="watch-date" className="text-sm font-medium text-white block mb-2">
                When did you watch it?
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  id="watch-date"
                  className={`w-full bg-gray-700 text-white rounded-lg pl-10 pr-3 py-3 border-gray-600 ${
                    isMobile ? 'text-base' : ''
                  }`}
                  value={watchedDate}
                  onChange={(e) => setWatchedDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="mb-4">
            <Label htmlFor="platform-select" className="text-sm font-medium text-white block mb-2">
              Platform (optional)
            </Label>
            {isPlatformsLoading ? (
              <p className="text-gray-400 text-sm">Loading platforms...</p>
            ) : platforms.length === 0 ? (
              <p className="text-gray-400 text-sm">No platforms available</p>
            ) : (
              <Select
                value={selectedPlatformId}
                onValueChange={(value) => setSelectedPlatformId(value !== 'none' ? value : 'none')}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select platform (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 text-white">
                  <SelectItem value="none">No platform</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id.toString()}>
                      {platform.name} {platform.is_default && '(Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="watch-notes" className="text-sm font-medium text-white block mb-1">
              Notes (optional)
            </Label>
            <Textarea
              id="watch-notes"
              rows={3}
              className={`w-full bg-gray-700 text-white rounded-lg px-3 py-2 border-gray-600 ${
                isMobile ? 'text-base' : ''
              }`}
              placeholder={`Add your thoughts about the ${item?.media_type === 'tv' ? 'show' : 'movie'}...`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || isPlatformsLoading}
              className={`w-full ${isMobile ? 'py-3 text-base' : ''} bg-[#E50914] hover:bg-[#f6121d] text-white`}
            >
              {isLoading
                ? 'Saving...'
                : status === 'to_watch'
                ? 'Add to Watchlist'
                : status === 'watching'
                ? 'Add to Watching'
                : 'Add to Watched'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}