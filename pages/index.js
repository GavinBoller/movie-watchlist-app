// /pages/index.js (New Landing Page)
import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { LogIn, Film } from 'lucide-react';
import Head from 'next/head';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';

  useEffect(() => {
    // If a session exists and is not loading, redirect to the search page
    if (session && status === 'authenticated') {
      router.push('/search');
    }
  }, [session, status, router]);

  // If loading or already authenticated (and redirecting), show minimal content or a loader
  if (isLoading || (session && status === 'authenticated')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <Film className="h-16 w-16 text-[#E50914] mb-4 animate-pulse" />
        <p>Loading...</p>
      </div>
    );
  }

  // If unauthenticated, show the landing page content
  return (
    <>
      <Head>
        <title>Welcome to Watchlist App</title>
        <meta name="description" content="Discover and manage your movie and TV show watchlist." />
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
        <Film className="h-20 w-20 text-[#E50914] mb-6" />
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome to Your Watchlist</h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl">
          Never lose track of movies and TV shows you want to watch.
          Organize, discover, and manage your personal watchlist with ease.
        </p>
        <Button
          onClick={() => signIn('google', { callbackUrl: '/search' })}
          size="lg"
          className="bg-[#E50914] hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-lg flex items-center gap-2"
        >
          <LogIn className="h-5 w-5" />
          Sign In with Google to Get Started
        </Button>
      </div>
    </>
  );
}