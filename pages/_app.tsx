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
import { debugAuthState } from '../utils/auth-debug.js';
import dynamic from 'next/dynamic';
import IOSSafariScrollBanner from '../components/IOSSafariScrollBanner';

const PWAInstallBanner = dynamic(() => import('../components/PWAInstallBanner'), {
  ssr: false
});

// Load debug utility only in development and only on client side
const SafariPWADebug = process.env.NODE_ENV === 'development' 
  ? dynamic(() => import('../utils/safari-pwa-debug'), { ssr: false })
  : null;

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
    
    // Initialize PWA features including service worker registration
    // Modified to work in both dev and prod for testing
    const shouldRegisterSW = typeof window !== 'undefined' && 
                            'serviceWorker' in navigator && 
                            (process.env.NODE_ENV === 'production' || 
                             process.env.NEXT_PUBLIC_USE_HTTPS === 'true');
    
    if (shouldRegisterSW) {
      console.log('Initializing PWA features');
      // Initialize PWA features including service worker registration
      initPWA();
      
      // Check if we're running in PWA mode
      setIsPWA(isPWAMode());
      
      // Handle offline actions when coming back online
      window.addEventListener('online', () => {
        // If you implement offline capabilities, handle them here
        console.log('App is back online');
      });
    } else {
      console.log('PWA features not initialized:', { 
        environment: process.env.NODE_ENV,
        serviceWorkerSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
        useHttps: process.env.NEXT_PUBLIC_USE_HTTPS
      });
    }
    
    // Debug auth state in development with HTTPS enabled
    if (typeof window !== 'undefined') {
      console.log('Debug mode: Monitoring authentication state');
      debugAuthState();
      
      // Debug auth on navigation events
      const handleRouteChange = () => {
        console.log('Route changed, checking auth state');
        debugAuthState();
      };
      
      // Add route change listener
      if (typeof window.next !== 'undefined' && window.next.router) {
        window.next.router.events.on('routeChangeComplete', handleRouteChange);
      }
      
      return () => {
        // Remove route change listener
        if (typeof window.next !== 'undefined' && window.next.router) {
          window.next.router.events.off('routeChangeComplete', handleRouteChange);
        }
      };
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
              {/* iOS Safari scroll banner for best experience */}
              <IOSSafariScrollBanner />
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