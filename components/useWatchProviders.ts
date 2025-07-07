// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { ProvidersData } from '../types';

interface UseWatchProvidersResult {
  providers: ProvidersData | null;
  isLoading: boolean;
  error: string | null;
}

export function useWatchProviders(
  tmdbId: string | number | null, 
  mediaType: 'movie' | 'tv' | null
): UseWatchProvidersResult {
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tmdbId || !mediaType) {
      setIsLoading(false);
      return;
    }

    const fetchProviders = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {        
        const res = await fetch(`/api/where-to-watch?tmdbId=${tmdbId}&media_type=${mediaType}`);
        if (!res.ok) throw new Error('Failed to fetch providers');
        const data = await res.json();
        setProviders(data.providers || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setProviders(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [tmdbId, mediaType]);

  return { providers, isLoading, error };
}