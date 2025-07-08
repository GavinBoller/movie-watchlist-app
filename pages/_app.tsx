// @ts-nocheck
// Added the apple-touch-icon in _document.tsx instead
import React, { useEffect } from 'react';
import '../styles/globals.css';
import { ToastProvider, WatchlistProvider } from '../components/ToastProvider';
import Head from 'next/head';
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from 'swr';
import type { AppProps } from 'next/app';
import { registerServiceWorker, handleOfflineActions } from '../lib/serviceWorker';

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps): React.ReactElement {
  useEffect(() => {
    // Register Service Worker only in production and if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      registerServiceWorker()
        .then((registration) => {
          console.log('Service Worker registered successfully');
          
          // Handle offline actions when coming back online
          window.addEventListener('online', () => {
            handleOfflineActions();
          });
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error);
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
        {/* apple-touch-icon is now explicitly defined here */}
        {/* removed unsupported theme-color meta tag; color is defined in manifest.json instead */}
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Movie Watchlist" />
      </Head>
      <SessionProvider 
        session={session}
        refetchInterval={60}
        refetchOnWindowFocus={true}
        refetchWhenOffline={false}
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
            </WatchlistProvider>
          </ToastProvider>
        </SWRConfig>
      </SessionProvider>
    </>
  );
}