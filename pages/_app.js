import Header from '../components/Header';
import { ToastProvider } from '../components/ToastContext';
import '../styles/globals.css';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      {children}
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <ToastProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ToastProvider>
  );
}

export default MyApp;
