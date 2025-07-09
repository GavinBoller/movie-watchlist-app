// @ts-nocheck
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { X, Save, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { WatchlistItem, Platform } from '../types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface EditModalProps {
  item: WatchlistItem;
  onSave: (item: WatchlistItem) => void;
  onClose: () => void;
}

export default function EditModal({ item, onSave, onClose }: EditModalProps): React.ReactElement {
  const [status, setStatus] = useState<string>(item.status || 'to_watch');
  // Correctly format the date for the input field, which expects YYYY-MM-DD
  const [watchedDate, setWatchedDate] = useState<string>(
    item.watchedDate ? new Date(item.watchedDate).toISOString().split('T')[0] : ''
  );
  const [platform, setPlatform] = useState<string>(item.platform || '');
  const [notes, setNotes] = useState<string>(item.notes || '');
  const [seasonNumber, setSeasonNumber] = useState<string>(item.seasonNumber?.toString() || '');
  const [saving, setSaving] = useState<boolean>(false);
  const { addToast } = useToast();

  // Fetch platforms dynamically using SWR
  const { data: platformsData, error: platformsError } = useSWR<{platforms: Platform[]}>('/api/platforms', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000, // 1 hour (platforms rarely change)
    keepPreviousData: true,
  });
  const platforms = platformsData?.platforms || [];
  const isLoadingPlatforms = !platformsData && !platformsError;

  useEffect(() => {
    // If status is changed to something other than 'watched', clear the date.
    if (status !== 'watched') {
      setWatchedDate('');
    } 
    // If status is changed to 'watched' and there's no date, set it to today.
    else if (status === 'watched' && !watchedDate) {
      setWatchedDate(new Date().toISOString().split('T')[0]);
    }
  }, [status]); // This effect runs whenever the 'status' changes.

  useEffect(() => {
    setSeasonNumber(item.seasonNumber?.toString() || '');
  }, [item.seasonNumber]);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      const updatedItem: WatchlistItem = {
        ...item,
        status,
        watchedDate: status === 'watched' ? new Date(watchedDate) : null,
        platform,
        notes,
        seasonNumber: item.mediaType === 'tv' ? (seasonNumber ? parseInt(seasonNumber) : null) : null,
      };
      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      if (!res.ok) throw new Error('Failed to update watchlist item');
      onSave(updatedItem);
      addToast({
        id: Date.now(),
        title: 'Success!',
        description: 'Watchlist item updated.',
        variant: 'success'
      });
      onClose();
    } catch (error) {
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to update watchlist item: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#292929] rounded-lg p-6 w-[90%] max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">Edit Watchlist Item</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div>
            <label className="block text-white mb-1">Watch Status</label>
            <div className="flex gap-3">
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  value="to_watch"
                  checked={status === 'to_watch'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mr-2"
                />
                To Watch
              </label>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  value="watching"
                  checked={status === 'watching'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mr-2"
                />
                Watching
              </label>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  value="watched"
                  checked={status === 'watched'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mr-2"
                />
                Watched
              </label>
            </div>
          </div>

          {/* Watched Date */}
          <div>
            <label className="block text-white mb-1">Watched Date</label>
            <input
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={status !== 'watched'}
              title="Watched Date"
              placeholder="Select watched date"
            />
          </div>

          {/* Season Number - New Input for TV Shows */}
          {item.mediaType === 'tv' && (
            <div className="mb-4 flex items-center gap-2">
              <label htmlFor="seasonNumber" className="text-sm font-medium text-white mb-0 whitespace-nowrap">
                Season Number (optional)
              </label>
              <input
                type="number"
                min="1"
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(e.target.value)}
                className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 text-sm w-32"
                placeholder="e.g. 1"
                title="Season Number"
              />
            </div>
          )}

          {/* Platform */}
          <div className="mb-4 flex items-center gap-2">
            <label htmlFor="platform-select" className="text-sm font-medium text-white mb-0 whitespace-nowrap">
              Platform (optional)
            </label>
            <div className="flex-1">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                disabled={isLoadingPlatforms}
                title="Platform selection"
              >
                {isLoadingPlatforms ? (
                  <option>Loading platforms...</option>
                ) : platformsError ? (
                  <option>Error loading platforms</option>
                ) : (
                  <>
                    <option value="">Select Platform</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-white mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
              rows={3}
              placeholder="Add your notes here..."
              title="Notes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-[#E50914] text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
