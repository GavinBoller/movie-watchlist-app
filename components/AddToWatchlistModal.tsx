// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { CalendarIcon, Clapperboard, Tv2, X, PlayCircle, CheckCircle, Clock, Star } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import WhereToWatch from './WhereToWatch'; // Import the new component
import useSWR from 'swr';
import { TMDBMovie, WatchlistItem, Platform, ProvidersData } from '../types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AddToWatchlistModalProps {
  item: TMDBMovie | WatchlistItem | null;
  onSaveSuccess?: (item: WatchlistItem) => Promise<void> | void;
  onClose: () => void;
  mode?: 'add' | 'edit';
}

const AddToWatchlistModal = function AddToWatchlistModal({ item, onSaveSuccess, onClose, mode = 'add' }: AddToWatchlistModalProps): React.ReactElement | null {
  if (!item) {
    console.warn('AddToWatchlistModal: item is undefined');
    return null;
  }

  const [status, setStatus] = useState<string>(item?.status || 'to_watch');
  const [watchedDate, setWatchedDate] = useState<string>(item?.watchedDate ? new Date(item.watchedDate).toISOString().split('T')[0] : '');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('none');
  const [notes, setNotes] = useState<string>(item?.notes || '');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isPlatformsLoading, setIsPlatformsLoading] = useState<boolean>(true);
  const { addToast } = useToast();
  const [seasonNumber, setSeasonNumber] = useState<string>(item?.seasonNumber?.toString() || '');

  const isEditing = mode === 'edit';
  const tmdbId = isEditing ? (item as WatchlistItem)?.movieId : (item as TMDBMovie)?.id;
  
  // Use SWR to fetch full details, which includes watch providers, unifying the data source.
  const { data: details, error: detailsError } = useSWR<TMDBMovie & { watch_providers?: ProvidersData }>(
    tmdbId && item?.mediaType ? `/api/details?id=${tmdbId}&media_type=${item.mediaType}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1 hour (movie/show details rarely change)
      keepPreviousData: false,
    }
  );

  const providers = details?.watch_providers;
  const isLoadingProviders = !details && !detailsError;

  const mediaTypeLabel = item?.mediaType === 'tv' ? 'Show' : 'Movie';
  const displayInfo = item?.releaseDate || item?.first_air_date
    ? `${(item.releaseDate || item.first_air_date).toString().split('-')[0]} • ${item.genres || 'N/A'}`
    : 'N/A';

  useEffect(() => {
    console.log('AddToWatchlistModal item:', item);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // When status is changed away from 'watched', clear the date.
    if (status !== 'watched' && watchedDate) {
      setWatchedDate('');
    }
    // If status is changed to 'watched' and there's no date, set it to today.
    else if (status === 'watched' && !watchedDate) {
      setWatchedDate(new Date().toISOString().split('T')[0]);
    }
  }, [status]);

  // Effect to handle Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    async function fetchPlatforms(): Promise<void> {
      setIsPlatformsLoading(true);
      try {
        const res = await fetch(`/api/platforms`);
        if (!res.ok) throw new Error('Failed to fetch platforms');
        const data: Platform[] = await res.json();
        const sortedPlatforms = data.sort((a, b) => {
          if (a.isDefault) return -1;
          if (b.isDefault) return 1;
          return a.name.localeCompare(b.name);
        });
        setPlatforms(sortedPlatforms);

        if (item?.platform) {
          const platform = sortedPlatforms.find((p) => p.name === item.platform);
          setSelectedPlatformId(platform ? platform.id.toString() : 'none');
        } else {
          const defaultPlatform = sortedPlatforms.find((p) => p.isDefault);
          setSelectedPlatformId(defaultPlatform ? defaultPlatform.id.toString() : 'none');
        }
      } catch (error: any) {
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
  }, [item?.platform, addToast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let apiPayload = {
        // Fields from modal state
        status,
        platform: platforms.find((p) => p.id.toString() === selectedPlatformId)?.name || null,
        watched_date: status === 'watched' ? watchedDate : null,
        notes: notes || null,
        seasonNumber: item.media_type === 'tv' ? seasonNumber || null : null,

        // Fields derived from 'item' prop
        title: item.title || item.name,
        overview: item.overview,
        poster: isEditing ? item.poster : item.poster_path,
        release_date: item.release_date || item.first_air_date,
        media_type: item.media_type,
        imdb_id: item.imdb_id || null,
        vote_average: item.vote_average ? parseFloat(item.vote_average) : null,
        runtime: item.runtime || null,
        seasons: item.media_type === 'tv' ? (isEditing ? item.seasons : item.number_of_seasons) || null : null,
        episodes: item.media_type === 'tv' ? (isEditing ? item.episodes : item.number_of_episodes) || null : null,
        genres: item.genres || null, // Ensure genres are included in the payload
      };

      if (isEditing) {
        apiPayload.id = item.id; // DB ID of the watchlist entry
        apiPayload.movie_id = item.movie_id; // TMDB ID
      } else { // Adding new
        apiPayload.movie_id = item.id; // TMDB ID
      }

      console.log('Saving to watchlist. Mode:', mode, 'Payload:', apiPayload);

      const res = await fetch('/api/watchlist', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === 'Item already in watchlist' && !isEditing) {
          onClose();
          return;
        }
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'save'}`);
      }

      const responseData = await res.json();
      if (onSaveSuccess) {
        await onSaveSuccess(responseData.item || responseData);
      }

      addToast({
        id: Date.now(),
        title: 'Success',
        description: `${apiPayload.title || (isEditing ? 'Item' : 'Item')} ${isEditing ? 'updated' : 'added to watchlist'}`,
      });

      onClose();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} to watchlist:`, error);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: error.message || `Failed to ${isEditing ? 'update' : 'save'} to watchlist`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const posterFieldName = isEditing ? 'poster' : 'poster_path';
  const posterValue = item[posterFieldName];
  
  // Helper function to decode HTML entities if present (like &#x2F; to /)
  const decodeHtmlEntities = (str) => {
    if (!str) return '';
    // Create a temporary element to use the browser's built-in HTML decoding
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };
  
  const posterUrl = posterValue
    ? `https://image.tmdb.org/t/p/w${isMobile ? '185' : '154'}${decodeHtmlEntities(posterValue)}`
    : '/placeholder-image.svg';

  const actionText = isEditing ? 'Update' : 'Add to';
  const buttonText = isLoading
    ? 'Saving...'
    : status === 'to_watch'
    ? `${actionText} Watchlist`
    : status === 'watching'
    ? `${actionText} Currently Watching`
    : `${actionText} Watched`;

  const modalTitleAction = isEditing ? 'Edit in' : 'Add to';
  const modalTitleText = status === 'to_watch' ? `${modalTitleAction} Watchlist` :
                       status === 'watching' ? `${modalTitleAction} Currently Watching` : `${modalTitleAction} Watched`;

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
            {modalTitleText}
          </h2>
          <p className="text-gray-400 text-sm">
            Add this {mediaTypeLabel.toLowerCase()} to your{' '}
            {status === 'to_watch' ? 'watchlist' : status === 'watching' ? 'currently watching' : 'watched'} list
          </p>
        </div>
        <div className={isMobile ? 'flex flex-col mb-4' : 'flex mb-4'}>
          <div className={isMobile ? 'relative mx-auto mb-3' : 'relative'}>
            <img
              src={posterUrl}
              alt={item.title || item.name}
              className={`rounded ${isMobile ? 'h-36' : 'w-24'}`}
              width={isMobile ? "96" : "96"}
              height={isMobile ? "144" : "144"}
              loading="eager"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.svg';
              }}
            />
            <div
              className={`absolute top-2 right-2 text-white text-xs font-bold py-1 px-2 rounded-full ${
                item.media_type === 'tv' ? 'bg-teal-600' : 'bg-purple-600'
              }`}
            >
              {item.media_type === 'tv' ? 'TV' : 'Movie'}
            </div>
          </div>
          <div className={isMobile ? 'text-center' : 'ml-4'}>
            <h4 className="font-bold text-lg text-white">{item.title || item.name || 'Untitled'}</h4>
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
                {item.vote_average != null && !isNaN(parseFloat(item.vote_average))
                  ? parseFloat(item.vote_average).toFixed(1)
                  : 'N/A'}
              </span>
              <Star className="h-4 w-4 text-[#F5C518] fill-current ml-1" />
            </div>
            {/* Where to Watch component added here */}
            <WhereToWatch providers={providers} isLoading={isLoadingProviders} />
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
          <RadioGroup value={status} onValueChange={setStatus} className="space-y-2 mb-4 text-white">
            <div className={`flex items-center space-x-2 rounded-lg p-3 transition cursor-pointer
              ${status === 'to_watch' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
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
            <div className={`flex items-center space-x-2 rounded-lg p-3 transition cursor-pointer
              ${status === 'watching' ? 'bg-amber-700 hover:bg-amber-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              <RadioGroupItem value="watching" id="status-watching" />
              <Label
                htmlFor="status-watching"
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <PlayCircle className="h-4 w-4 text-green-400" />
                <div>
                  <div className="font-medium">Currently Watching</div>
                  <div className="text-xs text-gray-400">Started but not finished</div>
                </div>
              </Label>
            </div>
            <div className={`flex items-center space-x-2 rounded-lg p-3 transition cursor-pointer
              ${status === 'watched' ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              <RadioGroupItem value="watched" id="status-watched" />
              <Label
                htmlFor="status-watched"
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <CheckCircle className="h-4 w-4 text-green-400" />
                <div>
                  <div className="font-medium">Watched</div>
                  <div className="text-xs text-gray-400">Already Watched</div>
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
                    isMobile ? 'text-base min-h-[44px]' : ''
                  }`}
                  value={watchedDate}
                  onChange={(e) => setWatchedDate(e.target.value)}
                />
              </div>
            </div>
          )}
          {item.media_type === 'tv' && (
            <div className="mb-4 flex items-center gap-2">
              <label htmlFor="seasonNumber" className="text-sm font-medium text-white mb-0 whitespace-nowrap">
                Season Number (optional)
              </label>
              <input
                type="number"
                min="1"
                value={seasonNumber}
                onChange={e => setSeasonNumber(e.target.value)}
                className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 text-sm w-32 min-h-[40px]"
                placeholder="e.g. 1"
              />
            </div>
          )}
          <div className="mb-4 flex items-center gap-2">
            <Label htmlFor="platform-select" className="text-sm font-medium text-white mb-0 whitespace-nowrap">
              Platform (optional)
            </Label>
            <div className="flex-1">
              {isPlatformsLoading ? (
                <p className="text-gray-400 text-sm">Loading platforms...</p>
              ) : platforms.length === 0 ? (
                <p className="text-gray-400 text-sm">No platforms available</p>
              ) : (
                <Select
                  value={selectedPlatformId}
                  onValueChange={(value) => setSelectedPlatformId(value !== 'none' ? value : 'none')}
                >
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white min-h-[44px]">
                    <SelectValue placeholder="Select platform (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    <SelectItem value="none" className="min-h-[40px]">No platform</SelectItem>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id.toString()} className="min-h-[40px]">
                        {platform.name} {platform.is_default && '(Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="mb-4">
            <Label htmlFor="watch-notes" className="text-sm font-medium text-white block mb-2">
              Notes (optional)
            </Label>
            <Textarea
              id="watch-notes"
              rows={3}
              className={`w-full bg-gray-700 text-white rounded-lg px-3 py-2 border-gray-600 ${
                isMobile ? 'text-base min-h-[80px]' : ''
              }`}
              placeholder={`Add your thoughts about the ${item.media_type === 'tv' ? 'show' : 'movie'}...`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || isPlatformsLoading}
              className={`w-full ${isMobile ? 'py-3 text-base' : ''} bg-[#E50914] hover:bg-[#f6121d] text-white min-h-[44px] flex items-center justify-center`}
            >
              {isLoading && <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {buttonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Export the component explicitly
export default AddToWatchlistModal;
