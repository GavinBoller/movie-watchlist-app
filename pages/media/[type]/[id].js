/* pages/media/[type]/[id].js */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';

export default function MediaDetail() {
  const router = useRouter();
  const { type, id } = router.query;
  const [media, setMedia] = useState(null);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder

  useEffect(() => {
    if (type && id) {
      const fetchMedia = async () => {
        try {
          console.log(`Fetching ${type}/${id}`);
          console.log('NEXT_PUBLIC_TMDB_API_KEY:', process.env.NEXT_PUBLIC_TMDB_API_KEY);
          const response = await axios.get(
            `https://api.themoviedb.org/3/${type}/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
          );
          console.log('Media response:', response.data);
          setMedia(response.data);
          setError(null);
        } catch (error) {
          console.error('Error fetching media details:', error.message);
          setError('Failed to load media details.');
        }
      };
      fetchMedia();
    }
  }, [type, id]);

  const addToWatchlist = async () => {
    if (!media) return;
    try {
      await axios.post('/api/watchlist', {
        id: media.id.toString(),
        title: media.title || media.name,
        overview: media.overview,
        poster: media.poster_path,
        release_date: media.release_date || media.first_air_date,
        media_type: type,
      });
      alert(`${media.title || media.name} added to watchlist! Please refresh the watchlist page.`);
    } catch (error) {
      console.error('Error adding to watchlist:', error.message);
      alert('Failed to add to watchlist.');
    }
  };

  if (!media && !error) return <div className="min-h-screen bg-background text-foreground p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-4">
      <header className="bg-background border-b border-border mb-6">
        <div className="container mx-auto max-w-4xl py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            Watchlist
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-primary hover:underline text-lg">
              Search
            </Link>
            {isLoggedIn ? (
              <>
                <span className="text-foreground">Welcome, User</span>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted text-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsLoggedIn(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 text-lg"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl">
        {error && <p className="text-destructive mb-6">{error}</p>}
        {media && (
          <div className="flex flex-col md:flex-row items-center">
            {media.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                alt={media.title || media.name}
                className="w-full md:w-1/3 rounded-lg mb-4 md:mb-0 md:mr-6"
              />
            )}
            <div className="md:w-2/3">
              <h1 className="text-3xl font-bold mb-3">{media.title || media.name}</h1>
              <p className="text-muted-foreground mb-3">
                {type === 'movie' ? 'Movie' : 'TV Show'} | Release Date: {media.release_date || media.first_air_date}
              </p>
              <p className="mb-4">{media.overview}</p>
              <button
                onClick={addToWatchlist}
                className="bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 text-lg"
              >
                Add to Watchlist
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
