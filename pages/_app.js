import { ToastProvider } from '../components/ToastContext';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <Component {...pageProps} />
      </div>
    </ToastProvider>
  );
}