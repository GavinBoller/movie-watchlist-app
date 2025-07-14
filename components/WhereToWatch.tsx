// @ts-nocheck
import React from 'react';
import { useSession } from 'next-auth/react';
import { Skeleton } from './ui/skeleton';
import { Provider, ProvidersData } from '../types';

interface WhereToWatchProps {
  providers: ProvidersData | Provider[] | null;
  isLoading: boolean;
}

const WhereToWatch: React.FC<WhereToWatchProps> = ({ providers, isLoading }) => {
  const { data: session } = useSession();
  const displayCountry = session?.user?.country || 'AU';

  // Handle different provider data formats
  let streamingAndFreeProviders = [];
  let hasRentOrBuy = false;
  
  if (providers) {
    if (Array.isArray(providers)) {
      // Simple array format (old format)
      streamingAndFreeProviders = providers;
    } else if (typeof providers === 'object') {
      // Check if it's the standard TMDB format with flatrate/free properties
      if (providers.flatrate || providers.free) {
        const flatrate = providers.flatrate?.map(p => p.provider_name) || [];
        const free = providers.free?.map(p => p.provider_name) || [];
        // Combine and get unique providers, then sort them alphabetically
        streamingAndFreeProviders = [...new Set([...flatrate, ...free])].sort();
        
        // Check if there are options to rent or buy
        hasRentOrBuy = (providers.rent?.length > 0 || providers.buy?.length > 0);
      } 
      // Handle other object formats
      else if (providers.providers || providers.results) {
        // Try to extract from nested objects
        const countryData = providers.results?.[displayCountry] || {};
        const flatrate = countryData.flatrate?.map(p => p.provider_name) || [];
        const free = countryData.free?.map(p => p.provider_name) || [];
        streamingAndFreeProviders = [...new Set([...flatrate, ...free])].sort();
        hasRentOrBuy = (countryData.rent?.length > 0 || countryData.buy?.length > 0);
      }
    }
  }

  return (
    <div className="mt-3">
      <h4 className="font-semibold text-sm text-gray-300">Where to Watch ({displayCountry} Stream/Free):</h4>
      {isLoading ? (
        <Skeleton className="h-5 w-3/4 mt-1" />
      ) : streamingAndFreeProviders.length > 0 ? (
        <p className="text-sm text-gray-400">{streamingAndFreeProviders.join(', ')}</p>
      ) : hasRentOrBuy ? (
        <p className="text-sm text-gray-400 italic">Available for rent or purchase</p>
      ) : (
        <p className="text-sm text-gray-400">N/A</p>
      )}
    </div>
  );
};

export default WhereToWatch;
