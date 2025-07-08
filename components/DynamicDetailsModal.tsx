import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { TMDBMovie } from '../types';

// Define the props type
interface DetailsModalProps {
  item: TMDBMovie;
  onClose: () => void;
  onAddToWatchlist: (item: TMDBMovie) => void;
  isInWatchlist?: boolean;
}

// Use explicit loading component
const LoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-2xl mx-4">
      <div className="flex mb-4">
        <Skeleton className="h-32 w-24 rounded mr-4" />
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <div className="flex space-x-2 mb-4">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
        </div>
      </div>
      <Skeleton className="h-32 w-full mb-4" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  </div>
);

// Use the standard dynamic import approach
const DynamicDetailsModal = dynamic(() => import('./DetailsModal'), {
  loading: () => <LoadingFallback />,
  ssr: false
});

export default DynamicDetailsModal;
