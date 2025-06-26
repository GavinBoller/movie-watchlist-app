'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react'; // Import the X icon
import { useSession } from 'next-auth/react'; // Import useSession
import useSWR from 'swr';

const ToastContext = createContext();
const WatchlistContext = createContext();

let toastIdCounter = 0;

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch watchlist');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    toastIdCounter += 1;
    setToasts((prev) => [...prev, { ...toast, id: toast.id || `${Date.now()}-${toastIdCounter}` }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <Toaster toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
}

export function WatchlistProvider({ children }) {
  const { data: session } = useSession(); // Get session status
  const shouldFetch = !!session; // Only fetch if there's a session

  // Fetch ALL watchlist items for client-side operations like the 'exclude' filter on the search page.
  // A high limit is used to simulate fetching all items.
  const { data, error, mutate } = useSWR(shouldFetch ? '/api/watchlist?limit=9999' : null, fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: true, // Revalidate when window regains focus
    revalidateIfStale: true, // Revalidate if data is stale
    // onError can be simplified or made more user-friendly if needed
    onError: (err) => console.warn('Watchlist SWR Error (likely due to no session or API issue):', err.status, err.info),
    onSuccess: (data) => console.log('Watchlist SWR Success:', { itemsCount: data?.items?.length || 0, total: data?.total }),
  });

  const watchlist = Array.isArray(data?.items)
    ? data.items.map((item) => ({
        ...item,
        vote_average: item.vote_average ? parseFloat(item.vote_average) : null,
      }))
    : [];

  return (
    <WatchlistContext.Provider value={{ watchlist, isLoading: !data && !error, error, mutate }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

function Toaster({ toasts, dismissToast }) {
  return (
    <div className="fixed z-50 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <div
      className={`group pointer-events-auto fixed max-w-[420px] p-6 pr-8 rounded-md shadow-lg transition-all duration-300 ${
        toast.variant === 'destructive'
          ? 'bg-red-600 text-white border-red-700'
          : 'bg-gray-800 text-white border-gray-700'
      } ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } sm:bottom-4 sm:right-4 top-4 left-4 sm:top-auto sm:left-auto border w-[calc(100%-2rem)] sm:w-auto`}
    >
      {toast.title && <h3 className="font-semibold">{toast.title}</h3>}
      {toast.description && <p>{toast.description}</p>}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-2 rounded-full p-1 text-gray-300 transition-colors hover:bg-white/20 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Close toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
