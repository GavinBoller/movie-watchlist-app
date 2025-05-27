'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { CalendarIcon, Clock, PlayCircle, CheckCircle, Star, X, Clapperboard, Tv2 } from 'lucide-react';
import { useToast } from './ToastContext';

export default function AddToWatchlistModal({ item, onSave, onClose }) {
  const [status, setStatus] = useState('to_watch');
  const [watchedDate, setWatchedDate] = useState('');
  const [selectedPlatformId, setSelectedPlatformId] = useState(null);
  const [notes, setNotes] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { addToast } = useToast();

  const userId = 1; // Temporary; replace with auth logic
  const mediaTypeLabel = item.media_type === 'tv' ? 'Show' : 'Movie';
  const displayInfo = item.release_date
    ? `${item.release_date.split('-')[0]} • ${item.genres || 'N/A'}`
    : 'N/A';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function fetchPlatforms() {
      try {
        const res = await fetch(`/api/platforms?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch platforms');
        const data = await res.json();
        setPlatforms(data);
        const defaultPlatform = data.find((p) => p.is_default);
        if (defaultPlatform) {
          setSelectedPlatformId(defaultPlatform.id.toString());
        }
      } catch (error) {
        console.error('Error fetching platforms:', error);
        addToast({
          id: Date.now(),
          title: 'Error',
          description: 'Failed to load platforms',
          variant: 'destructive',
        });
      }
    }
    fetchPlatforms();
  }, []);

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
    setIsLoading(true);
    try {
      await onSave({
        ...item,
        status,
        platform: platforms.find((p) => p.id.toString() === selectedPlatformId)?.name || null,
        watched_date: status === 'watched' ? watchedDate : null,
        notes: notes || null,
      });
      onClose();
    } catch (error) {
      console.error('Error saving to watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-[#1a1a1a] rounded-lg ${isMobile ? 'p-4 pb-6 w-[90vw]' : 'p-6 max-w-md w-full'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="pr-6">
          <h2 className="text-lg font-bold text-white">
            {status === 'to_watch'
              ? 'Add to To Watch'
              : status === 'watching'
                ? 'Add to Currently Watching'
                : 'Add to Watched'}
          </h2>
          <p className="text-gray-400 text-sm">
            Add this {mediaTypeLabel.toLowerCase()} to your{' '}
            {status === 'to_watch' ? 'to watch' : status === 'watching' ? 'currently watching' : 'watched'} list
          </p>
        </div>
        <div className={isMobile ? 'flex flex-col mb-4' : 'flex mb-4'}>
          <div className={isMobile ? 'relative mx-auto mb-3' : 'relative'}>
            <img
              src={`https://image.tmdb.org/t/p/w${isMobile ? '185' : '154'}${item.poster || '/placeholder.jpg'}`}
              alt={item.title}
              className={`rounded ${isMobile ? 'h-36' : 'w-24'}`}
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
                {item.vote_average?.toFixed(1) || 'N/A'}
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
            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer">
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
            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer">
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
            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer">
              <RadioGroupItem value="watched" id="status-watched" />
              <Label
                htmlFor="status-watched"
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <CheckCircle className="h-4 w-4 text-[#E50914]" />
                <div>
                  <div className="font-medium text-white">Watched</div>
                  <div className="text-xs text-gray-400">Already completed</div>
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
            <Select
              value={selectedPlatformId ? selectedPlatformId.toString() : 'none'}
              onValueChange={(value) => setSelectedPlatformId(value !== 'none' ? parseInt(value) : null)}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select platform (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="none">No platform</SelectItem>
                {platforms
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((platform) => (
                    <SelectItem key={platform.id} value={platform.id.toString()}>
                      {platform.name} {platform.is_default && '(Default)'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mb-4">
            <Label htmlFor="watch-notes" className="text-sm font-medium text-white block mb-2">
              Notes (optional)
            </Label>
            <Textarea
              id="watch-notes"
              rows={3}
              className={`w-full bg-gray-700 text-white rounded-lg px-3 py-2 border-gray-600 ${
                isMobile ? 'text-base' : ''
              }`}
              placeholder={`Add your thoughts about the ${item.media_type === 'tv' ? 'show' : 'movie'}...`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className={isMobile ? 'flex flex-col space-y-2' : 'flex justify-end space-x-2'}>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className={isMobile ? 'w-full py-3 text-base text-white' : 'text-white'}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`${
                isMobile ? 'w-full py-3 text-base' : ''
              } bg-[#E50914] hover:bg-[#f6121d] text-white`}
            >
              {isLoading
                ? 'Adding...'
                : status === 'to_watch'
                  ? 'Add to To Watch'
                  : status === 'watching'
                    ? 'Add to Currently Watching'
                    : 'Add to Watched'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}