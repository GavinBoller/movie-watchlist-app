import '../styles/globals.css';
import { ToastProvider, WatchlistProvider } from '../components/ToastContext';
import Head from 'next/head';
import { SessionProvider } from "next-auth/react"

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <title>Movie & TV Watchlist</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Search and manage your movie and TV watchlist" />
      </Head>
      {/*
        The `session` prop is automatically passed by Next.js if you're using
        server-side session fetching (e.g., in getServerSideProps).
        The SessionProvider will use this initial session if available.
      */}
      <SessionProvider session={session}>
        <ToastProvider>
          <WatchlistProvider>
            <Component {...pageProps} />
          </WatchlistProvider>
        </ToastProvider>
      </SessionProvider>
    </>
  );
}