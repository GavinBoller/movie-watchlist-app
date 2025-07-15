// types.ts - Central types file for the movie watchlist app

// TMDB Movie/TV Show types
export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
  genres?: Genre[];
  popularity?: number;
  original_language?: string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  movieId?: number; // For compatibility with watchlist items
  mediaType?: 'movie' | 'tv'; // Alternative casing for compatibility
}

export interface Genre {
  id: number;
  name: string;
}

// Watchlist types
export interface WatchlistItem {
  id?: number;
  movieId: number;
  title: string;
  poster_path: string | null;
  overview: string;
  mediaType: 'movie' | 'tv';
  releaseDate: string | null;
  status: string;
  notes?: string;
  watchedDate?: string | null;
  platformId?: number | string | null;
  seasonNumber?: number | null;
  rating?: number | null;
  movie_id?: string | number; // For compatibility with older API responses
  media_type?: 'movie' | 'tv'; // Alternative casing for compatibility
  release_date?: string; // Alternative casing for compatibility
  mode?: 'add' | 'edit'; // Used when showing the modal
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WatchlistResponse {
  watchlist: WatchlistItem[];
  total: number;
  platforms: Platform[];
}

// Platform types
export interface Platform {
  id: number;
  name: string;
  logoUrl?: string | null;
  isDefault: boolean;
  logo_path?: string | null;
  provider_id?: number | null;
  userId?: string;
}

// Provider types for "Where to Watch"
export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface CountryProviders {
  link: string;
  rent?: Provider[];
  buy?: Provider[];
  flatrate?: Provider[];
  ads?: Provider[];
  free?: Provider[];
}

export interface ProvidersData {
  id: number;
  results: {
    [countryCode: string]: CountryProviders;
  };
}

// Toast notification types
export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
}

// Country type for country selector
export interface Country {
  iso_3166_1: string;
  english_name: string;
  native_name?: string;
}
