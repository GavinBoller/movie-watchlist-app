// Common type definitions for the Movie Watchlist App

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  country?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface WatchlistItem {
  id: number;
  movieId: string;
  title: string;
  overview?: string | null;
  poster?: string | null;
  releaseDate?: Date | null;
  mediaType?: string | null;
  status?: string | null;
  platform?: string | null;
  notes?: string | null;
  watchedDate?: Date | null;
  addedAt?: Date | null;
  imdbId?: string | null;
  voteAverage?: number | null;
  runtime?: number | null;
  seasons?: number | null;
  episodes?: number | null;
  genres?: string | null;
  userId: string;
  seasonNumber?: number | null;
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: string[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  adult?: boolean;
  original_language?: string;
  original_title?: string;
  original_name?: string;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  total: number;
  filterCounts: {
    media: {
      all: number;
      movie: number;
      tv: number;
    };
    status: {
      all: number;
      to_watch: number;
      watching: number;
      watched: number;
    };
  };
}

export interface Platform {
  id: number;
  name: string;
  logoUrl?: string | null;
  isDefault?: boolean | null;
  createdAt?: Date | null;
  userId: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Country {
  iso_3166_1: string;
  english_name: string;
}

export interface Provider {
  provider_name: string;
  provider_id?: number;
  logo_path?: string;
}

export interface ProvidersData {
  flatrate?: Provider[];
  free?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

export interface ToastMessage {
  id: string | number;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Form types
export interface AddToWatchlistFormData {
  movie_id: string;
  title: string;
  overview?: string;
  poster?: string;
  release_date?: string;
  media_type: 'movie' | 'tv';
  status: 'to_watch' | 'watching' | 'watched';
  platform?: string;
  notes?: string;
  imdb_id?: string;
  vote_average?: number;
  runtime?: number;
  seasons?: number;
  episodes?: number;
  genres?: string;
  seasonNumber?: number;
}

// API Response types
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  message?: string;
};

// Search filters
export interface SearchFilters {
  query?: string;
  media_type?: 'all' | 'movie' | 'tv';
  genre_id?: number;
  min_rating?: number;
  sort_by?: string;
  discovery_mode?: 'text' | 'top_rated' | 'popular' | 'latest';
}

export interface WatchlistFilters {
  page?: number;
  limit?: number;
  search?: string;
  media?: 'all' | 'movie' | 'tv';
  status?: 'all' | 'to_watch' | 'watching' | 'watched';
  sort_by?: string;
}
