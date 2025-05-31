'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import useSWR from 'swr';

const ToastContext = createContext();
const WatchlistContext = createContext();

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
    setToasts((prev) => [...prev, { ...toast, id: toast.id || Date.now() }]);
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
  const { data, error, mutate } = useSWR('/api/watchlist?page=1&limit=50', fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    onError: (err) => console.error('Watchlist SWR Error:', err, err.info),
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
      className={`pointer-events-auto fixed max-w-[420px] p-6 pr-8 rounded-md shadow-lg transition-all duration-300 ${
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
        className="absolute right-2 top-2 sm:opacity-0 sm:group-hover:opacity-100 bg-gray-500 bg-opacity-50 rounded-full p-1"
        aria-label="Close toast"
      >
        ✕
      </button>
    </div>
  );
}