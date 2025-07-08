import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

// Dynamically import the ConfirmationModal component with loading fallback
const DynamicConfirmationModal = dynamic(
  () => import('./ConfirmationModal'),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
          <Skeleton className="h-6 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-6" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    ),
    ssr: false, // Disable server-side rendering for this component
  }
);

export default DynamicConfirmationModal;
