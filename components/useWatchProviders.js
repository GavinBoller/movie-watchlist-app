'use client';

import { useState, useEffect, useCallback } from 'react';

export function useWatchProviders(tmdbId, mediaType) {
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tmdbId || !mediaType) {
      setIsLoading(false);
      return;
    }

    const fetchProviders = async () => {
      setIsLoading(true);
      setError(null);
      try {        
        const res = await fetch(`/api/where-to-watch?tmdbId=${tmdbId}&media_type=${mediaType}`);
        if (!res.ok) throw new Error('Failed to fetch providers');
        const data = await res.json();
        setProviders(data.providers || []);
      } catch (err) {
        setError(err.message);
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [tmdbId, mediaType]);

  return { providers, isLoading, error };
}