import React from 'react';
import { useSession } from 'next-auth/react';
import { Skeleton } from './ui/skeleton';

const WhereToWatch = ({ providers, isLoading }) => {
  const { data: session } = useSession();
  const displayCountry = session?.user?.country || 'AU';

  // This logic now handles the rich provider object from /api/details
  let streamingAndFreeProviders = [];
  if (providers && typeof providers === 'object' && !Array.isArray(providers)) {
    const flatrate = providers.flatrate?.map(p => p.provider_name) || [];
    const free = providers.free?.map(p => p.provider_name) || [];
    // Combine and get unique providers, then sort them alphabetically
    streamingAndFreeProviders = [...new Set([...flatrate, ...free])].sort();
  } else if (Array.isArray(providers)) {
    // Fallback for the old API format (simple array of strings)
    streamingAndFreeProviders = providers;
  }

  // Check if there are options to rent or buy, even if streaming is not available.
  const hasRentOrBuy = providers && typeof providers === 'object' && (providers.rent?.length > 0 || providers.buy?.length > 0);

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
