// pages/media/[type]/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';

export default function MediaDetail() {
  const router = useRouter();
  const { type, id } = router.query;
  const [media, setMedia] = useState(null);

  useEffect(() => {
    if (type && id) {
      const fetchMedia = async () => {
        try {
          const response = await axios.get(
            `https://api.themoviedb.org/3/${type}/${id}?api_key=${process.env.TMDB_API_KEY}`
          );
          setMedia(response.data);
        } catch (error) {
          console.error('Error fetching media details:', error);
          alert('Failed to load media details.');
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
      alert(`${media.title || media.name} added to watchlist!`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert('Failed to add to watchlist.');
    }
  };

  if (!media) return <div className="min-h-screen bg-gray-900 text-white p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/" className="text-blue-400 hover:underline mb-4 inline-block">
          Back to Search
        </Link>
        <div className="flex flex-col md:flex-row items-center">
          {media.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
              alt={media.title || media.name}
              className="w-full md:w-1/3 rounded mb-4 md:mb-0 md:mr-4"
            />
          )}
          <div className="md:w-2/3">
            <h1 className="text-3xl font-bold mb-2">{media.title || media.name}</h1>
            <p className="text-gray-400 mb-2">
              {type === 'movie' ? 'Movie' : 'TV Show'} | Release Date: {media.release_date || media.first_air_date}
            </p>
            <p className="mb-4">{media.overview}</p>
            <button
              onClick={addToWatchlist}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Add to Watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}