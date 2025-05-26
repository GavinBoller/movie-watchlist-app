import { Trash, XCircle } from 'lucide-react';

export default function DeleteConfirmationModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#292929] rounded-lg p-6 w-[90%] max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Confirm Deletion</h2>
        <p className="text-gray-300 mb-4">
          Are you sure you want to remove "{item.title}" from your watchlist?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-[#E50914] text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <Trash className="h-4 w-4 mr-2" />
            Remove
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
