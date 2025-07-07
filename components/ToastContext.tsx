// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { ToastMessage, WatchlistItem, WatchlistResponse } from '../types';

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string | number) => void;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  isLoading: boolean;
  error: any;
  mutate: () => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

interface WatchlistProviderProps {
  children: ReactNode;
}

interface ToasterProps {
  toasts: ToastMessage[];
  dismissToast: (id: string | number) => void;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

let toastIdCounter = 0;

interface FetchError extends Error {
  info?: any;
  status?: number;
}

const fetcher = async (url: string): Promise<WatchlistResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error: FetchError = new Error('Failed to fetch watchlist');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export function ToastProvider({ children }: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    toastIdCounter += 1;
    const newToast: ToastMessage = { ...toast, id: `${Date.now()}-${toastIdCounter}` };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string | number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <Toaster toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
}

export function WatchlistProvider({ children }: WatchlistProviderProps): React.ReactElement {
  const { data: session } = useSession(); // Get session status
  const shouldFetch = !!session; // Only fetch if there's a session

  // Fetch ALL watchlist items for client-side operations like the 'exclude' filter on the search page.
  // A high limit is used to simulate fetching all items.
  const { data, error, mutate } = useSWR(shouldFetch ? '/api/watchlist?limit=9999' : null, fetcher, {
    dedupingInterval: 120000, // 2 minutes
    revalidateOnFocus: false, // Don't revalidate on window focus for better performance
    revalidateIfStale: true, // Revalidate if data is stale
    revalidateOnMount: true, // Always revalidate on component mount
    keepPreviousData: true, // Keep previous data to prevent UI flickering
    // onError can be simplified or made more user-friendly if needed
    onError: (err) => console.warn('Watchlist SWR Error (likely due to no session or API issue):', err.status, err.info),
  });

  const watchlist = Array.isArray(data?.items)
    ? data.items.map((item) => ({
        ...item,
        voteAverage: item.voteAverage ? parseFloat(item.voteAverage.toString()) : null,
      }))
    : [];

  return (
    <WatchlistContext.Provider value={{ watchlist, isLoading: !data && !error, error, mutate }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function useWatchlist(): WatchlistContextType {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

function Toaster({ toasts, dismissToast }: ToasterProps): React.ReactElement {
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

function Toast({ toast, onDismiss }: ToastProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState<boolean>(true);

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
      
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="mt-3 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {toast.action.label}
        </button>
      )}
      
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
