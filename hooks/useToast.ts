// @ts-nocheck
'use client';

import { createContext, useContext } from 'react';
import { ToastMessage, WatchlistItem } from '../types';

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

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function useWatchlist(): WatchlistContextType {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
