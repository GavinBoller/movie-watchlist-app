// @ts-nocheck
// Added the apple-touch-icon in _document.tsx instead
import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { ToastProvider, WatchlistProvider } from '../components/ToastProvider';
import Head from 'next/head';
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from 'swr';
import type { AppProps } from 'next/app';
import { initPWA, isPWAMode } from '../utils/pwa';
import dynamic from 'next/dynamic';

const PWAInstallBanner = dynamic(() => import('../components/PWAInstallBanner'), {
  ssr: false
});

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps): React.ReactElement {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    // Suppress NextAuth client errors that are safe to ignore
    const originalError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      
      // Suppress specific NextAuth client errors that occur during sign out
      if (errorMessage.includes('[next-auth][error][CLIENT_FETCH_ERROR]') && 
          errorMessage.includes('Cannot convert undefined or null to object')) {
        console.log('NextAuth: Suppressed sign out transition error');
        return;
      }
      
      // Call original console.error for all other errors
      originalError.apply(console, args);
    };
    
    // Register Service Worker only in production and if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      // Initialize PWA features including service worker registration
      initPWA();
      
      // Check if we're running in PWA mode
      setIsPWA(isPWAMode());
      
      // Handle offline actions when coming back online
      window.addEventListener('online', () => {
        // If you implement offline capabilities, handle them here
        console.log('App is back online');
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>Movie & TV Watchlist</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Search and manage your movie and TV watchlist" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Movie Watchlist" />
      </Head>
      <SessionProvider 
        session={session}
        refetchInterval={5 * 60} // Refetch session every 5 minutes
        refetchOnWindowFocus={true}
        // Add custom error handling to prevent sign out errors
        basePath="/api/auth"
      >
        <SWRConfig 
          value={{
            revalidateOnFocus: true,
            dedupingInterval: 60000, // 1 minute
            errorRetryCount: 3,
            shouldRetryOnError: true,
            // Enhanced offline support
            revalidateIfStale: false, // Don't revalidate stale data when offline
            revalidateOnReconnect: true, // Revalidate when connection is restored
          }}
        >
          <ToastProvider>
            <WatchlistProvider>
              <Component {...pageProps} />
              {/* Show PWA Install Banner only if not already in PWA mode */}
              {typeof window !== 'undefined' && !isPWA && <PWAInstallBanner />}
            </WatchlistProvider>
          </ToastProvider>
        </SWRConfig>
      </SessionProvider>
    </>
  );
}