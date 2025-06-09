import { createContext, useContext, useState, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher } from '../utils/fetcher';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { data: watchlist, mutate } = useSWR('/api/watchlist?limit=50', fetcher);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToWatchlist = useCallback(
    async (media) => {
      try {
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(media),
        });
        if (response.ok) {
          addToast('Added to watchlist', 'success');
          mutate();
        } else {
          addToast('Failed to add to watchlist', 'error');
        }
      } catch (error) {
        addToast('Error adding to watchlist', 'error');
      }
    },
    [addToast, mutate]
  );

  const removeFromWatchlist = useCallback(
    async (id) => {
      try {
        const response = await fetch(`/api/watchlist/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          addToast('Removed from watchlist', 'success');
          mutate();
        } else {
          addToast('Failed to remove from watchlist', 'error');
        }
      } catch (error) {
        addToast('Error removing from watchlist', 'error');
      }
    },
    [addToast, mutate]
  );

  return (
    <ToastContext.Provider
      value={{
        watchlist: watchlist?.data || [],
        addToWatchlist,
        removeFromWatchlist,
        addToast,
        removeToast,
      }}
    >
      <div className="fixed bottom-4 right-4 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`mb-2 p-4 rounded shadow-lg text-white ${
              toast.type === 'success'
                ? 'bg-green-600'
                : toast.type === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
          >
            {toast.message}
            <button
              className="ml-4 text-white hover:text-gray-200"
              onClick={() => removeToast(toast.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);