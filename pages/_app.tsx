// @ts-nocheck
import React from 'react';
import '../styles/globals.css';
import { ToastProvider, WatchlistProvider } from '../components/ToastContext';
import Head from 'next/head';
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from 'swr';
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps): React.ReactElement {
  return (
    <>
      <Head>
        <title>Movie & TV Watchlist</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Search and manage your movie and TV watchlist" />
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