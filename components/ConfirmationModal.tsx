// @ts-nocheck
import React, { useEffect } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}: ConfirmationModalProps): React.ReactElement | null {
  // Effect to handle Escape key press
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isLoading) {
        // Stop event propagation to prevent the global handler from processing it
        event.stopPropagation();
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#292929] rounded-lg p-6 w-[90%] max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <div className="bg-red-800/20 p-2 rounded-full mr-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="bg-gray-700 border-gray-600 hover:bg-gray-600 min-h-[44px] min-w-[100px]"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            variant="destructive" 
            className="bg-red-700 hover:bg-red-600 flex items-center min-h-[44px] min-w-[160px] justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirm Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}