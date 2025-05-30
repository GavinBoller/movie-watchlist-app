import '../styles/globals.css';
import { ToastProvider, WatchlistProvider } from '../components/ToastContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <ToastProvider>
      <WatchlistProvider>
        <Component {...pageProps} />
      </WatchlistProvider>
    </ToastProvider>
  );
}