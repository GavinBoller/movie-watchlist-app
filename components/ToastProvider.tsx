// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { ToastMessage, WatchlistItem, WatchlistResponse } from '../types';
import { ToastContext, WatchlistContext } from '../hooks/useToast';

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

let toastIdCounter = 0;

interface FetchError extends Error {
  info?: any;
  status?: number;
}

const fetcher = async (url: string): Promise<WatchlistResponse> => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as FetchError;
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export function ToastProvider({ children }: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    console.log('ToastProvider received:', toast);
    const id = ++toastIdCounter;
    const newToast = { ...toast, id };
    console.log('Final toast object in ToastProvider:', newToast);
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after delay
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration || 5000);
    }
  }, []);

  const dismissToast = useCallback((id: string | number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <Toaster toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
}

export function WatchlistProvider({ children }: WatchlistProviderProps): React.ReactElement {
  const { data: session, status } = useSession();

  const { data, error, mutate } = useSWR<WatchlistResponse, FetchError>(
    session ? '/api/watchlist?limit=9999' : null,
    fetcher,
    {
      // Allow initial fetch but reduce unnecessary revalidation
      revalidateOnMount: true,   // Allow initial fetch
      revalidateIfStale: false,  // Don't revalidate stale data
      revalidateOnFocus: false,  // Don't revalidate on focus
      revalidateOnReconnect: true, // Revalidate when connection restored
      refreshInterval: 0,        // No automatic refresh
      dedupingInterval: 120000,  // 2 minutes deduping
    }
  );

  const watchlist = data?.items || [];
  
  // More accurate loading state:
  // - If NextAuth is still loading, we're loading
  // - If unauthenticated, not loading
  // - If authenticated but SWR hasn't finished yet, loading
  // - If authenticated and we have data or error, not loading
  const isLoading = status === 'loading' || (status === 'authenticated' && !data && !error);

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      isLoading,
      error,
      mutate
    }}>
      {children}
    </WatchlistContext.Provider>
  );
}

function Toaster({ toasts, dismissToast }: ToasterProps): React.ReactElement | null {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
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
  console.log('Toast component in ToastProvider rendering:', toast);

  const bgColor = toast.variant === 'destructive' ? 'bg-red-500' : 'bg-gray-500';
  const textColor = 'text-white';

  return (
    <div className={`${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg max-w-sm space-y-2 animate-in slide-in-from-right-full`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {toast.title && (
            <div className="font-semibold text-sm">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm mt-1">{toast.description}</div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="ml-3 flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
      
      {toast.action && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={toast.action.onClick}
            className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {toast.action.label}
          </button>
          
          {toast.action.secondary && (
            <button
              onClick={toast.action.secondary.onClick}
              className="inline-flex items-center justify-center px-3 py-1 border border-white text-sm font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              {toast.action.secondary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
