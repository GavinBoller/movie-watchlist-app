import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { TMDBMovie, WatchlistItem } from '../types';

// Define the props type
interface AddToWatchlistModalProps {
  item: TMDBMovie | WatchlistItem | null;
  onSaveSuccess?: (item: WatchlistItem) => Promise<void> | void;
  onClose: () => void;
  mode?: 'add' | 'edit';
}

// Use explicit loading component
const LoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-lg mx-4">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-end mt-6 gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </div>
);

// Use the standard dynamic import approach
const DynamicAddToWatchlistModal = dynamic(() => import('./AddToWatchlistModal'), {
  loading: () => <LoadingFallback />,
  ssr: false
});

export default DynamicAddToWatchlistModal;
