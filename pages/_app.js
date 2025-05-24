// pages/_app.js
import { useState } from 'react';
import '../styles/variables.css';
import '../styles/globals.css';

function ErrorBoundary({ children }) {
  const [error, setError] = useState(null);

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return children;
}

export default function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}