import '../styles/globals.css';
import { ToastProvider } from '../components/ToastContext';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <ToastProvider>
      <Head>
        <title>Movie Watchlist</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </ToastProvider>
  );
}