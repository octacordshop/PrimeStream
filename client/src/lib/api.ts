import { apiRequest } from './queryClient';

export interface Movie {
  id: number;
  title: string;
  imdbId: string;
  tmdbId?: string;
  year?: number;
  poster?: string;
  plot?: string;
  rating?: string;
  runtime?: string;
  genre?: string;
  director?: string;
  actors?: string;
  isFeatured: boolean;
  isVisible: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface TVShow {
  id: number;
  title: string;
  imdbId: string;
  tmdbId?: string;
  year?: string; // Can be range like "2010-2022"
  poster?: string;
  plot?: string;
  rating?: string;
  seasons?: number;
  genre?: string;
  creator?: string;
  actors?: string;
  isFeatured: boolean;
  isVisible: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface Episode {
  id: number;
  tvShowId: number;
  season: number;
  episode: number;
  title: string;
  imdbId?: string;
  plot?: string;
  poster?: string;
  runtime?: string;
  airDate?: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: number;
  userId: number;
  mediaType: 'movie' | 'tv';
  mediaId: number;
  addedAt: string;
  content?: Movie | TVShow;
}

export interface RecentlyWatchedItem {
  id: number;
  userId: number;
  mediaType: 'movie' | 'tv';
  mediaId: number;
  episodeId?: number;
  watchedAt: string;
  progress: number;
  content?: Movie | TVShow;
  episode?: Episode;
}

// Fetch content
export async function fetchFeaturedContent() {
  const response = await apiRequest('GET', '/api/featured');
  return response.json();
}

export async function fetchLatestMovies(limit = 20, offset = 0) {
  const response = await apiRequest('GET', `/api/movies/latest?limit=${limit}&offset=${offset}`);
  return response.json();
}

export async function fetchLatestTVShows(limit = 20, offset = 0) {
  const response = await apiRequest('GET', `/api/tvshows/latest?limit=${limit}&offset=${offset}`);
  return response.json();
}

export async function fetchMovie(id: number) {
  const response = await apiRequest('GET', `/api/movies/${id}`);
  return response.json();
}

export async function fetchTVShow(id: number) {
  const response = await apiRequest('GET', `/api/tvshows/${id}`);
  return response.json();
}

export async function fetchEpisodes(tvShowId: number, season?: number) {
  const seasonParam = season ? `&season=${season}` : '';
  const response = await apiRequest('GET', `/api/tvshows/${tvShowId}/episodes?${seasonParam}`);
  return response.json();
}

export async function fetchEpisode(id: number) {
  const response = await apiRequest('GET', `/api/episodes/${id}`);
  return response.json();
}

export async function searchContent(query: string, limit = 20) {
  const response = await apiRequest('GET', `/api/search?q=${query}&limit=${limit}`);
  return response.json();
}

// Watchlist operations
export async function fetchWatchlist() {
  const response = await apiRequest('GET', '/api/watchlist');
  return response.json();
}

export async function addToWatchlist(item: { mediaType: string; mediaId: number }) {
  const response = await apiRequest('POST', '/api/watchlist', item);
  return response.json();
}

export async function removeFromWatchlist(id: number) {
  await apiRequest('DELETE', `/api/watchlist/${id}`);
  return true;
}

// Recently watched operations
export async function fetchRecentlyWatched(limit = 20) {
  const response = await apiRequest('GET', `/api/recently-watched?limit=${limit}`);
  return response.json();
}

export async function addToRecentlyWatched(item: {
  mediaType: string;
  mediaId: number;
  episodeId?: number;
  progress: number;
}) {
  const response = await apiRequest('POST', '/api/recently-watched', item);
  return response.json();
}

export async function updateWatchProgress(id: number, progress: number) {
  const response = await apiRequest('PATCH', `/api/recently-watched/${id}/progress`, { progress });
  return response.json();
}

// Admin operations
export async function fetchContentFromVidsrc(type: 'movie' | 'tv', page = 1) {
  const endpoint = type === 'movie' ? 'movies' : 'tvshows';
  const response = await apiRequest('POST', `/api/admin/fetch/${endpoint}?page=${page}`);
  return response.json();
}

export async function updateMovie(id: number, data: Partial<Movie>) {
  const response = await apiRequest('PATCH', `/api/admin/movies/${id}`, data);
  return response.json();
}

export async function updateTVShow(id: number, data: Partial<TVShow>) {
  const response = await apiRequest('PATCH', `/api/admin/tvshows/${id}`, data);
  return response.json();
}

export async function deleteMovie(id: number) {
  await apiRequest('DELETE', `/api/admin/movies/${id}`);
  return true;
}

export async function deleteTVShow(id: number) {
  await apiRequest('DELETE', `/api/admin/tvshows/${id}`);
  return true;
}
