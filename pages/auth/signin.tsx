// @ts-nocheck
// pages/auth/signin.tsx
import React, { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function SignIn(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState<string>('Please wait while we sign you in...');
  const [redirectAttempted, setRedirectAttempted] = useState<boolean>(false);
  
  // Handle redirects based on authentication state
  useEffect(() => {
    console.log('SignIn page - Auth status:', status, 'Session:', session ? 'Present' : 'None');
    
    // Get the callback URL from query params, or use search as default
    const callbackUrl = router.query.callbackUrl || '/search';
    
    // Prevent redirect loops - check if it's a watchlist redirect
    const isWatchlistRedirect = callbackUrl === '/watchlist';
    
    // If we're already authenticated and haven't attempted a redirect yet
    if (status === 'authenticated' && session && !redirectAttempted) {
      setRedirectAttempted(true); // Mark that we've attempted a redirect
      setMessage('Successfully signed in! Redirecting...');
      console.log('Authenticated, redirecting to callback URL:', callbackUrl);
      
      // Store authentication state in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('authRedirectTime', Date.now().toString());
      }
      
      // Use replace to avoid adding to history stack
      setTimeout(() => {
        router.replace(callbackUrl);
      }, 1000);
    } 
    // Not signed in - trigger Google sign-in but only if we haven't attempted before
    else if (status === 'unauthenticated' && !redirectAttempted) {
      setRedirectAttempted(true); // Prevent multiple sign-in attempts
      setMessage('Initiating sign-in with Google...');
      console.log('Initiating Google sign-in');
      
      // Store a flag to prevent redirect loops
      if (typeof window !== 'undefined') {
        const now = Date.now();
        sessionStorage.setItem('lastSignInAttempt', now.toString());
        
        // If this is from a watchlist redirect and we had a recent attempt, break the loop
        if (isWatchlistRedirect) {
          const lastAttempt = parseInt(sessionStorage.getItem('lastWatchlistRedirect') || '0');
          const timeSince = now - lastAttempt;
          
          if (lastAttempt && timeSince < 10000) {
            console.log('Breaking potential redirect loop, redirecting to home');
            router.replace('/');
            return;
          }
          
          sessionStorage.setItem('lastWatchlistRedirect', now.toString());
        }
      }
      
      // Delay the sign-in to ensure state is updated
      setTimeout(() => {
        signIn('google', { 
          callbackUrl,
          redirect: true // Force redirect to happen
        });
      }, 500);
    }
    // Loading - wait for status to resolve
    else if (status === 'loading') {
      setMessage('Checking authentication status...');
    }
  }, [status, session, router, redirectAttempted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-[#E50914]">Signing In</h2>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#E50914] mx-auto"></div>
        <p className="mt-6 text-gray-300">{message}</p>
        <p className="mt-4 text-sm text-gray-500">Status: {status}</p>
      </div>
    </div>
  );
}
