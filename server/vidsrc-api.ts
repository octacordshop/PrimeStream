import axios from 'axios';
import { storage } from './storage';
import { InsertMovie, InsertTVShow, InsertEpisode } from '@shared/schema';

// URLs for the Vidsrc API
const VIDSRC_MOVIES_API = 'https://vidsrc.xyz/movies/latest/page-{page}.json';
const VIDSRC_TVSHOWS_API = 'https://vidsrc.xyz/tvshows/latest/page-{page}.json';
const VIDSRC_EPISODES_API = 'https://vidsrc.xyz/episodes/latest/page-{page}.json';

interface VidsrcMovie {
  title: string;
  year?: number;
  poster?: string;
  plot?: string;
  imdb_id: string;
  tmdb_id?: string;
  runtime?: string;
  rating?: string;
  genre?: string;
  director?: string;
  actors?: string;
}

interface VidsrcTVShow {
  title: string;
  year?: string;
  poster?: string;
  plot?: string;
  imdb_id: string;
  tmdb_id?: string;
  seasons?: number;
  rating?: string;
  genre?: string;
  creator?: string; 
  actors?: string;
}

interface VidsrcEpisode {
  title: string;
  imdb_id?: string;
  plot?: string;
  poster?: string;
  runtime?: string;
  air_date?: string;
  show_imdb_id: string;
  season: number;
  episode: number;
}

/**
 * Fetches the latest movies from Vidsrc API
 * @param page Page number to fetch
 * @returns Array of movies
 */
export async function fetchMoviesFromVidsrc(page = 1): Promise<{
  added: number;
  updated: number;
  total: number;
}> {
  try {
    // Check if we have already cached this request
    const endpoint = VIDSRC_MOVIES_API.replace('{page}', page.toString());
    const cached = await storage.getCachedData(endpoint);
    
    // If cached data exists and is less than 1 hour old, use it
    if (cached && new Date().getTime() - new Date(cached.lastUpdated).getTime() < 60 * 60 * 1000) {
      try {
        // Handle the data as a JSON string or an already parsed object
        const dataStr = typeof cached.data === 'string' 
          ? cached.data 
          : JSON.stringify(cached.data);
          
        const movies = JSON.parse(dataStr) as VidsrcMovie[];
        return { 
          added: 0, 
          updated: 0,
          total: movies.length 
        };
      } catch (error) {
        console.error('Error parsing cached movie data:', error);
      }
    }
    
    // If no cache or it's outdated, make a new request
    const response = await axios.get(endpoint);
    let movies: VidsrcMovie[] = [];
    
    // Make sure we have valid data
    if (response.data && Array.isArray(response.data)) {
      movies = response.data;
      
      // Save the response data to cache
      await storage.setCachedData({
        endpoint,
        data: JSON.stringify(movies)
      });
    } else {
      console.log('Invalid data received from Vidsrc movies API', response.data);
      return { added: 0, updated: 0, total: 0 };
    }
    
    // Process and save each movie to database
    let added = 0;
    let updated = 0;
    
    for (const movie of movies) {
      const existingMovie = await storage.getMovieByImdbId(movie.imdb_id);
      
      const movieData: InsertMovie = {
        title: movie.title,
        imdbId: movie.imdb_id,
        tmdbId: movie.tmdb_id || null,
        year: movie.year || null,
        poster: movie.poster || null,
        plot: movie.plot || null,
        rating: movie.rating || null,
        runtime: movie.runtime || null,
        genre: movie.genre || null,
        director: movie.director || null,
        actors: movie.actors || null,
        isFeatured: false,
        isVisible: true
      };
      
      if (existingMovie) {
        await storage.updateMovie(existingMovie.id, movieData);
        updated++;
      } else {
        await storage.createMovie(movieData);
        added++;
      }
    }
    
    return {
      added,
      updated,
      total: movies.length
    };
    
  } catch (error) {
    console.error('Error fetching movies from Vidsrc:', error);
    throw error;
  }
}

/**
 * Fetches the latest TV shows from Vidsrc API
 * @param page Page number to fetch
 * @returns Array of TV shows
 */
export async function fetchTVShowsFromVidsrc(page = 1): Promise<{
  added: number;
  updated: number;
  total: number;
}> {
  try {
    // Check if we have already cached this request
    const endpoint = VIDSRC_TVSHOWS_API.replace('{page}', page.toString());
    const cached = await storage.getCachedData(endpoint);
    
    // If cached data exists and is less than 1 hour old, use it
    if (cached && new Date().getTime() - new Date(cached.lastUpdated).getTime() < 60 * 60 * 1000) {
      try {
        // Handle the data as a JSON string or an already parsed object
        const dataStr = typeof cached.data === 'string' 
          ? cached.data 
          : JSON.stringify(cached.data);
          
        const tvShows = JSON.parse(dataStr) as VidsrcTVShow[];
        return { 
          added: 0, 
          updated: 0,
          total: tvShows.length 
        };
      } catch (error) {
        console.error('Error parsing cached TV show data:', error);
      }
    }
    
    // If no cache or it's outdated, make a new request
    const response = await axios.get(endpoint);
    let tvShows: VidsrcTVShow[] = [];
    
    // Make sure we have valid data
    if (response.data && Array.isArray(response.data)) {
      tvShows = response.data;
      
      // Save the response data to cache
      await storage.setCachedData({
        endpoint,
        data: JSON.stringify(tvShows)
      });
    } else {
      console.log('Invalid data received from Vidsrc TV shows API', response.data);
      return { added: 0, updated: 0, total: 0 };
    }
    
    // Process and save each TV show to database
    let added = 0;
    let updated = 0;
    
    for (const tvShow of tvShows) {
      const existingTVShow = await storage.getTVShowByImdbId(tvShow.imdb_id);
      
      const tvShowData: InsertTVShow = {
        title: tvShow.title,
        imdbId: tvShow.imdb_id,
        tmdbId: tvShow.tmdb_id || null,
        year: tvShow.year || null,
        poster: tvShow.poster || null,
        plot: tvShow.plot || null,
        rating: tvShow.rating || null,
        seasons: tvShow.seasons || null,
        genre: tvShow.genre || null,
        creator: tvShow.creator || null,
        actors: tvShow.actors || null,
        isFeatured: false,
        isVisible: true
      };
      
      if (existingTVShow) {
        await storage.updateTVShow(existingTVShow.id, tvShowData);
        updated++;
      } else {
        await storage.createTVShow(tvShowData);
        added++;
      }
    }
    
    return {
      added,
      updated,
      total: tvShows.length
    };
    
  } catch (error) {
    console.error('Error fetching TV shows from Vidsrc:', error);
    throw error;
  }
}

/**
 * Fetches the latest episodes from Vidsrc API
 * @param page Page number to fetch
 * @returns Array of episodes
 */
export async function fetchEpisodesFromVidsrc(page = 1): Promise<{
  added: number;
  updated: number;
  total: number;
}> {
  try {
    // Check if we have already cached this request
    const endpoint = VIDSRC_EPISODES_API.replace('{page}', page.toString());
    const cached = await storage.getCachedData(endpoint);
    
    // If cached data exists and is less than 1 hour old, use it
    if (cached && new Date().getTime() - new Date(cached.lastUpdated).getTime() < 60 * 60 * 1000) {
      try {
        // Handle the data as a JSON string or an already parsed object
        const dataStr = typeof cached.data === 'string' 
          ? cached.data 
          : JSON.stringify(cached.data);
          
        const episodes = JSON.parse(dataStr) as VidsrcEpisode[];
        return { 
          added: 0, 
          updated: 0,
          total: episodes.length 
        };
      } catch (error) {
        console.error('Error parsing cached episode data:', error);
      }
    }
    
    // If no cache or it's outdated, make a new request
    const response = await axios.get(endpoint);
    let episodes: VidsrcEpisode[] = [];
    
    // Make sure we have valid data
    if (response.data && Array.isArray(response.data)) {
      episodes = response.data;
      
      // Save the response data to cache
      await storage.setCachedData({
        endpoint,
        data: JSON.stringify(episodes)
      });
    } else {
      console.log('Invalid data received from Vidsrc episodes API', response.data);
      return { added: 0, updated: 0, total: 0 };
    }
    
    // Process and save each episode to database
    let added = 0;
    let updated = 0;
    
    for (const episode of episodes) {
      // First, make sure we have the TV show in our database
      const tvShow = await storage.getTVShowByImdbId(episode.show_imdb_id);
      
      if (!tvShow) {
        console.log(`TV Show with IMDB ID ${episode.show_imdb_id} not found, skipping episode`);
        continue;
      }
      
      // Check if the episode already exists
      const existingEpisodes = await storage.getEpisodes(tvShow.id, episode.season);
      const existingEpisode = existingEpisodes.find(e => 
        e.season === episode.season && e.episode === episode.episode
      );
      
      const episodeData: InsertEpisode = {
        title: episode.title,
        tvShowId: tvShow.id,
        season: episode.season,
        episode: episode.episode,
        imdbId: episode.imdb_id || null,
        plot: episode.plot || null,
        poster: episode.poster || null,
        runtime: episode.runtime || null,
        airDate: episode.air_date || null,
      };
      
      if (existingEpisode) {
        await storage.updateEpisode(existingEpisode.id, episodeData);
        updated++;
      } else {
        await storage.createEpisode(episodeData);
        added++;
      }
    }
    
    return {
      added,
      updated,
      total: episodes.length
    };
    
  } catch (error) {
    console.error('Error fetching episodes from Vidsrc:', error);
    throw error;
  }
}

/**
 * Refreshes the content database with the latest data from Vidsrc
 */
export async function refreshContentDatabase(pagesToFetch = 1): Promise<{
  movies: { added: number; updated: number; total: number };
  tvShows: { added: number; updated: number; total: number };
  episodes: { added: number; updated: number; total: number };
}> {
  const results = {
    movies: { added: 0, updated: 0, total: 0 },
    tvShows: { added: 0, updated: 0, total: 0 },
    episodes: { added: 0, updated: 0, total: 0 }
  };
  
  // Fetch multiple pages if needed
  for (let page = 1; page <= pagesToFetch; page++) {
    // Fetch movies
    const moviesResult = await fetchMoviesFromVidsrc(page);
    results.movies.added += moviesResult.added;
    results.movies.updated += moviesResult.updated;
    results.movies.total += moviesResult.total;
    
    // Fetch TV shows
    const tvShowsResult = await fetchTVShowsFromVidsrc(page);
    results.tvShows.added += tvShowsResult.added;
    results.tvShows.updated += tvShowsResult.updated;
    results.tvShows.total += tvShowsResult.total;
    
    // Fetch episodes
    const episodesResult = await fetchEpisodesFromVidsrc(page);
    results.episodes.added += episodesResult.added;
    results.episodes.updated += episodesResult.updated;
    results.episodes.total += episodesResult.total;
  }
  
  return results;
}