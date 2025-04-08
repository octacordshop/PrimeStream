import axios from 'axios';
import { storage } from './storage';
import { InsertMovie, InsertTVShow, InsertEpisode } from '@shared/schema';

// TMDB API configuration
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

// Function to check if a movie is available on Vidsrc
async function isMovieAvailableOnVidsrc(imdbId: string): Promise<boolean> {
  try {
    const response = await axios.head(`https://vidsrc.me/embed/movie?imdb=${imdbId}`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Function to check if a TV show is available on Vidsrc
async function isTVShowAvailableOnVidsrc(imdbId: string, season: number, episode: number): Promise<boolean> {
  try {
    const response = await axios.head(`https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Get movie details from TMDB
async function getMovieDetailsFromTMDB(tmdbId: number) {
  const response = await axios.get(`${TMDB_API_BASE_URL}/movie/${tmdbId}`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      append_to_response: 'credits,external_ids'
    }
  });
  
  return response.data;
}

// Get TV show details from TMDB
async function getTVShowDetailsFromTMDB(tmdbId: number) {
  const response = await axios.get(`${TMDB_API_BASE_URL}/tv/${tmdbId}`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      append_to_response: 'credits,external_ids'
    }
  });
  
  return response.data;
}

// Get TV show season details from TMDB
async function getTVShowSeasonFromTMDB(tmdbId: number, seasonNumber: number) {
  const response = await axios.get(`${TMDB_API_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      append_to_response: 'credits,external_ids'
    }
  });
  
  return response.data;
}

// Discover movies by year
export async function discoverMoviesByYear(year: number, page = 1): Promise<{
  added: number;
  unavailable: number;
  total: number;
}> {
  try {
    // Check if we have already cached this request
    const endpoint = `${TMDB_API_BASE_URL}/discover/movie?primary_release_year=${year}&page=${page}`;
    const cached = await storage.getCachedData(endpoint);
    
    // If cached data exists and is less than 24 hours old, use it
    if (cached && new Date().getTime() - new Date(cached.lastUpdated).getTime() < 24 * 60 * 60 * 1000) {
      try {
        const dataStr = typeof cached.data === 'string' 
          ? cached.data 
          : JSON.stringify(cached.data);
          
        const parsedData = JSON.parse(dataStr);
        return { 
          added: 0, 
          unavailable: 0,
          total: parsedData.results.length 
        };
      } catch (error) {
        console.error('Error parsing cached movie data:', error);
      }
    }
    
    // If no cache or it's outdated, make a new request
    const response = await axios.get(`${TMDB_API_BASE_URL}/discover/movie`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        primary_release_year: year,
        sort_by: 'popularity.desc',
        page: page
      }
    });
    
    // Save the response data to cache
    await storage.setCachedData({
      endpoint,
      data: JSON.stringify(response.data)
    });
    
    // Process movies
    let added = 0;
    let unavailable = 0;
    const movies = response.data.results;
    
    for (const movie of movies) {
      try {
        // Get full movie details including IMDb ID
        const movieDetails = await getMovieDetailsFromTMDB(movie.id);
        const imdbId = movieDetails.external_ids.imdb_id;
        
        if (!imdbId) {
          console.log(`Movie ${movie.title} has no IMDb ID, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if movie is available on Vidsrc
        const isAvailable = await isMovieAvailableOnVidsrc(imdbId);
        
        if (!isAvailable) {
          console.log(`Movie ${movie.title} (IMDb: ${imdbId}) not available on Vidsrc, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if movie already exists in our database
        const existingMovie = await storage.getMovieByImdbId(imdbId);
        
        // Get director and actors information
        const directors = movieDetails.credits.crew
          .filter(person => person.job === 'Director')
          .map(director => director.name)
          .join(', ');
          
        const actors = movieDetails.credits.cast
          .slice(0, 5)
          .map(actor => actor.name)
          .join(', ');
        
        // Prepare movie data
        const movieData: InsertMovie = {
          title: movie.title,
          imdbId: imdbId,
          tmdbId: movie.id.toString(),
          year: parseInt(movie.release_date?.substring(0, 4)) || null,
          poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
          plot: movie.overview || null,
          rating: movie.vote_average ? movie.vote_average.toString() : null,
          runtime: movieDetails.runtime ? `${movieDetails.runtime}` : null,
          genre: movieDetails.genres.map(g => g.name).join(', ') || null,
          director: directors || null,
          actors: actors || null,
          isFeatured: movie.vote_average > 7.5, // Feature high-rated movies
          isVisible: true
        };
        
        if (existingMovie) {
          await storage.updateMovie(existingMovie.id, movieData);
        } else {
          await storage.createMovie(movieData);
          added++;
        }
      } catch (error) {
        console.error(`Error processing movie ${movie.title}:`, error);
        unavailable++;
      }
    }
    
    return {
      added,
      unavailable,
      total: movies.length
    };
    
  } catch (error) {
    console.error('Error discovering movies by year:', error);
    throw error;
  }
}

// Discover TV shows by year
export async function discoverTVShowsByYear(year: number, page = 1): Promise<{
  added: number;
  unavailable: number;
  total: number;
}> {
  try {
    // Check if we have already cached this request
    const endpoint = `${TMDB_API_BASE_URL}/discover/tv?first_air_date_year=${year}&page=${page}`;
    const cached = await storage.getCachedData(endpoint);
    
    // If cached data exists and is less than 24 hours old, use it
    if (cached && new Date().getTime() - new Date(cached.lastUpdated).getTime() < 24 * 60 * 60 * 1000) {
      try {
        const dataStr = typeof cached.data === 'string' 
          ? cached.data 
          : JSON.stringify(cached.data);
          
        const parsedData = JSON.parse(dataStr);
        return { 
          added: 0, 
          unavailable: 0,
          total: parsedData.results.length 
        };
      } catch (error) {
        console.error('Error parsing cached TV show data:', error);
      }
    }
    
    // If no cache or it's outdated, make a new request
    const response = await axios.get(`${TMDB_API_BASE_URL}/discover/tv`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        first_air_date_year: year,
        sort_by: 'popularity.desc',
        page: page
      }
    });
    
    // Save the response data to cache
    await storage.setCachedData({
      endpoint,
      data: JSON.stringify(response.data)
    });
    
    // Process TV shows
    let added = 0;
    let unavailable = 0;
    const tvShows = response.data.results;
    
    for (const tvShow of tvShows) {
      try {
        // Get full TV show details including IMDb ID
        const tvShowDetails = await getTVShowDetailsFromTMDB(tvShow.id);
        const imdbId = tvShowDetails.external_ids.imdb_id;
        
        if (!imdbId) {
          console.log(`TV Show ${tvShow.name} has no IMDb ID, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if at least one episode is available on Vidsrc
        // We'll check season 1, episode 1 as a baseline
        const isAvailable = await isTVShowAvailableOnVidsrc(imdbId, 1, 1);
        
        if (!isAvailable) {
          console.log(`TV Show ${tvShow.name} (IMDb: ${imdbId}) not available on Vidsrc, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if TV show already exists in our database
        const existingTVShow = await storage.getTVShowByImdbId(imdbId);
        
        // Get creator and actors information
        const creators = tvShowDetails.created_by
          .map(creator => creator.name)
          .join(', ');
          
        const actors = tvShowDetails.credits.cast
          .slice(0, 5)
          .map(actor => actor.name)
          .join(', ');
        
        // Prepare TV show data
        const tvShowData: InsertTVShow = {
          title: tvShow.name,
          imdbId: imdbId,
          tmdbId: tvShow.id.toString(),
          year: tvShowDetails.first_air_date 
            ? (tvShowDetails.last_air_date && tvShowDetails.status !== 'Ended' 
              ? `${tvShowDetails.first_air_date.substring(0, 4)}-present`
              : `${tvShowDetails.first_air_date.substring(0, 4)}-${tvShowDetails.last_air_date.substring(0, 4)}`)
            : null,
          poster: tvShow.poster_path ? `${TMDB_IMAGE_BASE_URL}${tvShow.poster_path}` : null,
          plot: tvShow.overview || null,
          rating: tvShow.vote_average ? tvShow.vote_average.toString() : null,
          seasons: tvShowDetails.number_of_seasons || null,
          genre: tvShowDetails.genres.map(g => g.name).join(', ') || null,
          creator: creators || null,
          actors: actors || null,
          isFeatured: tvShow.vote_average > 7.5, // Feature high-rated shows
          isVisible: true
        };
        
        let tvShowId: number;
        
        if (existingTVShow) {
          await storage.updateTVShow(existingTVShow.id, tvShowData);
          tvShowId = existingTVShow.id;
        } else {
          const newTVShow = await storage.createTVShow(tvShowData);
          tvShowId = newTVShow.id;
          added++;
        }
        
        // Get and add episodes for each season
        for (let seasonNum = 1; seasonNum <= (tvShowDetails.number_of_seasons || 0); seasonNum++) {
          await addEpisodesForSeason(tvShowId, tvShow.id, imdbId, seasonNum);
        }
      } catch (error) {
        console.error(`Error processing TV show ${tvShow.name}:`, error);
        unavailable++;
      }
    }
    
    return {
      added,
      unavailable,
      total: tvShows.length
    };
    
  } catch (error) {
    console.error('Error discovering TV shows by year:', error);
    throw error;
  }
}

// Add episodes for a season
async function addEpisodesForSeason(tvShowId: number, tmdbId: number, showImdbId: string, seasonNumber: number): Promise<{
  added: number;
  unavailable: number;
}> {
  try {
    const seasonDetails = await getTVShowSeasonFromTMDB(tmdbId, seasonNumber);
    let added = 0;
    let unavailable = 0;
    
    for (const episode of seasonDetails.episodes) {
      try {
        // Check if episode is available on Vidsrc
        const isAvailable = await isTVShowAvailableOnVidsrc(showImdbId, seasonNumber, episode.episode_number);
        
        if (!isAvailable) {
          console.log(`Episode S${seasonNumber}E${episode.episode_number} not available on Vidsrc, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if episode already exists
        const existingEpisodes = await storage.getEpisodes(tvShowId, seasonNumber);
        const existingEpisode = existingEpisodes.find(e => 
          e.season === seasonNumber && e.episode === episode.episode_number
        );
        
        const episodeData: InsertEpisode = {
          title: episode.name,
          tvShowId: tvShowId,
          season: seasonNumber,
          episode: episode.episode_number,
          imdbId: episode.external_ids?.imdb_id || null,
          plot: episode.overview || null,
          poster: episode.still_path ? `${TMDB_IMAGE_BASE_URL}${episode.still_path}` : null,
          runtime: episode.runtime ? `${episode.runtime}` : null,
          airDate: episode.air_date || null,
        };
        
        if (existingEpisode) {
          await storage.updateEpisode(existingEpisode.id, episodeData);
        } else {
          await storage.createEpisode(episodeData);
          added++;
        }
      } catch (error) {
        console.error(`Error processing episode S${seasonNumber}E${episode.episode_number}:`, error);
        unavailable++;
      }
    }
    
    return { added, unavailable };
    
  } catch (error) {
    console.error(`Error adding episodes for season ${seasonNumber}:`, error);
    return { added: 0, unavailable: 0 };
  }
}

// Get popular movies
export async function getPopularMovies(page = 1): Promise<{
  added: number;
  unavailable: number;
  total: number;
}> {
  try {
    // Check if we have already cached this request
    const endpoint = `${TMDB_API_BASE_URL}/movie/popular?page=${page}`;
    const cached = await storage.getCachedData(endpoint);
    
    // If cached data exists and is less than 24 hours old, use it
    if (cached && new Date().getTime() - new Date(cached.lastUpdated).getTime() < 24 * 60 * 60 * 1000) {
      try {
        const dataStr = typeof cached.data === 'string' 
          ? cached.data 
          : JSON.stringify(cached.data);
          
        const parsedData = JSON.parse(dataStr);
        return { 
          added: 0, 
          unavailable: 0,
          total: parsedData.results.length 
        };
      } catch (error) {
        console.error('Error parsing cached popular movie data:', error);
      }
    }
    
    // If no cache or it's outdated, make a new request
    const response = await axios.get(`${TMDB_API_BASE_URL}/movie/popular`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        page: page
      }
    });
    
    // Save the response data to cache
    await storage.setCachedData({
      endpoint,
      data: JSON.stringify(response.data)
    });
    
    // Process movies
    let added = 0;
    let unavailable = 0;
    const movies = response.data.results;
    
    for (const movie of movies) {
      try {
        // Get full movie details including IMDb ID
        const movieDetails = await getMovieDetailsFromTMDB(movie.id);
        const imdbId = movieDetails.external_ids.imdb_id;
        
        if (!imdbId) {
          console.log(`Movie ${movie.title} has no IMDb ID, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if movie is available on Vidsrc
        const isAvailable = await isMovieAvailableOnVidsrc(imdbId);
        
        if (!isAvailable) {
          console.log(`Movie ${movie.title} (IMDb: ${imdbId}) not available on Vidsrc, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if movie already exists in our database
        const existingMovie = await storage.getMovieByImdbId(imdbId);
        
        // Get director and actors information
        const directors = movieDetails.credits.crew
          .filter(person => person.job === 'Director')
          .map(director => director.name)
          .join(', ');
          
        const actors = movieDetails.credits.cast
          .slice(0, 5)
          .map(actor => actor.name)
          .join(', ');
        
        // Prepare movie data
        const movieData: InsertMovie = {
          title: movie.title,
          imdbId: imdbId,
          tmdbId: movie.id.toString(),
          year: parseInt(movie.release_date?.substring(0, 4)) || null,
          poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
          plot: movie.overview || null,
          rating: movie.vote_average ? movie.vote_average.toString() : null,
          runtime: movieDetails.runtime ? `${movieDetails.runtime}` : null,
          genre: movieDetails.genres.map(g => g.name).join(', ') || null,
          director: directors || null,
          actors: actors || null,
          isFeatured: movie.vote_average > 7.5, // Feature high-rated movies
          isVisible: true
        };
        
        if (existingMovie) {
          await storage.updateMovie(existingMovie.id, movieData);
        } else {
          await storage.createMovie(movieData);
          added++;
        }
      } catch (error) {
        console.error(`Error processing movie ${movie.title}:`, error);
        unavailable++;
      }
    }
    
    return {
      added,
      unavailable,
      total: movies.length
    };
    
  } catch (error) {
    console.error('Error getting popular movies:', error);
    throw error;
  }
}

// Get popular TV shows
export async function getPopularTVShows(page = 1): Promise<{
  added: number;
  unavailable: number;
  total: number;
}> {
  try {
    // Check if we have already cached this request
    const endpoint = `${TMDB_API_BASE_URL}/tv/popular?page=${page}`;
    const cached = await storage.getCachedData(endpoint);
    
    // If cached data exists and is less than 24 hours old, use it
    if (cached && new Date().getTime() - new Date(cached.lastUpdated).getTime() < 24 * 60 * 60 * 1000) {
      try {
        const dataStr = typeof cached.data === 'string' 
          ? cached.data 
          : JSON.stringify(cached.data);
          
        const parsedData = JSON.parse(dataStr);
        return { 
          added: 0, 
          unavailable: 0,
          total: parsedData.results.length 
        };
      } catch (error) {
        console.error('Error parsing cached popular TV show data:', error);
      }
    }
    
    // If no cache or it's outdated, make a new request
    const response = await axios.get(`${TMDB_API_BASE_URL}/tv/popular`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        page: page
      }
    });
    
    // Save the response data to cache
    await storage.setCachedData({
      endpoint,
      data: JSON.stringify(response.data)
    });
    
    // Process TV shows
    let added = 0;
    let unavailable = 0;
    const tvShows = response.data.results;
    
    for (const tvShow of tvShows) {
      try {
        // Get full TV show details including IMDb ID
        const tvShowDetails = await getTVShowDetailsFromTMDB(tvShow.id);
        const imdbId = tvShowDetails.external_ids.imdb_id;
        
        if (!imdbId) {
          console.log(`TV Show ${tvShow.name} has no IMDb ID, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if at least one episode is available on Vidsrc
        // We'll check season 1, episode 1 as a baseline
        const isAvailable = await isTVShowAvailableOnVidsrc(imdbId, 1, 1);
        
        if (!isAvailable) {
          console.log(`TV Show ${tvShow.name} (IMDb: ${imdbId}) not available on Vidsrc, skipping`);
          unavailable++;
          continue;
        }
        
        // Check if TV show already exists in our database
        const existingTVShow = await storage.getTVShowByImdbId(imdbId);
        
        // Get creator and actors information
        const creators = tvShowDetails.created_by
          .map(creator => creator.name)
          .join(', ');
          
        const actors = tvShowDetails.credits.cast
          .slice(0, 5)
          .map(actor => actor.name)
          .join(', ');
        
        // Prepare TV show data
        const tvShowData: InsertTVShow = {
          title: tvShow.name,
          imdbId: imdbId,
          tmdbId: tvShow.id.toString(),
          year: tvShowDetails.first_air_date 
            ? (tvShowDetails.last_air_date && tvShowDetails.status !== 'Ended' 
              ? `${tvShowDetails.first_air_date.substring(0, 4)}-present`
              : `${tvShowDetails.first_air_date.substring(0, 4)}-${tvShowDetails.last_air_date.substring(0, 4)}`)
            : null,
          poster: tvShow.poster_path ? `${TMDB_IMAGE_BASE_URL}${tvShow.poster_path}` : null,
          plot: tvShow.overview || null,
          rating: tvShow.vote_average ? tvShow.vote_average.toString() : null,
          seasons: tvShowDetails.number_of_seasons || null,
          genre: tvShowDetails.genres.map(g => g.name).join(', ') || null,
          creator: creators || null,
          actors: actors || null,
          isFeatured: tvShow.vote_average > 7.5, // Feature high-rated shows
          isVisible: true
        };
        
        let tvShowId: number;
        
        if (existingTVShow) {
          await storage.updateTVShow(existingTVShow.id, tvShowData);
          tvShowId = existingTVShow.id;
        } else {
          const newTVShow = await storage.createTVShow(tvShowData);
          tvShowId = newTVShow.id;
          added++;
        }
        
        // Get and add episodes for each season
        for (let seasonNum = 1; seasonNum <= (tvShowDetails.number_of_seasons || 0); seasonNum++) {
          await addEpisodesForSeason(tvShowId, tvShow.id, imdbId, seasonNum);
        }
      } catch (error) {
        console.error(`Error processing TV show ${tvShow.name}:`, error);
        unavailable++;
      }
    }
    
    return {
      added,
      unavailable,
      total: tvShows.length
    };
    
  } catch (error) {
    console.error('Error getting popular TV shows:', error);
    throw error;
  }
}

// Check available subtitles for a movie or TV show
export async function getAvailableSubtitles(type: 'movie' | 'tv', imdbId: string): Promise<string[]> {
  try {
    // First, try to check if this content has cached subtitle list
    const cacheKey = `subtitles_${type}_${imdbId}`;
    const cached = await storage.getCachedData(cacheKey);
    
    if (cached && cached.data) {
      console.log(`Using cached subtitles for ${type} ${imdbId}`);
      try {
        if (typeof cached.data === 'string') {
          const parsed = JSON.parse(cached.data);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error parsing cached subtitle data:', e);
      }
    }
    
    // This is a simulation of checking available subtitles
    // In a real implementation, we'd make a request to Vidsrc or another API
    // to determine actual available subtitles for this specific content
    
    // Get TMDB details to determine how popular the content is
    // More popular content typically has more subtitles available
    let popularity = 0;
    
    if (type === 'movie') {
      const movie = await storage.getMovieByImdbId(imdbId);
      if (movie && movie.tmdbId) {
        try {
          const details = await getMovieDetailsFromTMDB(parseInt(movie.tmdbId));
          popularity = details.popularity || 0;
        } catch (e) {
          console.error('Error getting movie details:', e);
        }
      }
    } else {
      const tvShow = await storage.getTVShowByImdbId(imdbId);
      if (tvShow && tvShow.tmdbId) {
        try {
          const details = await getTVShowDetailsFromTMDB(parseInt(tvShow.tmdbId));
          popularity = details.popularity || 0;
        } catch (e) {
          console.error('Error getting TV show details:', e);
        }
      }
    }
    
    // Common subtitles that are almost always available
    const commonSubtitles = ['en', 'es', 'fr'];
    
    // Additional subtitles for more popular content
    const additionalSubtitles = ['de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru'];
    
    // Determine available subtitles based on popularity
    let availableSubtitles = [...commonSubtitles];
    
    // More popular content gets more subtitle options
    if (popularity > 50) {
      availableSubtitles = [...availableSubtitles, ...additionalSubtitles.slice(0, 5)];
    } else if (popularity > 20) {
      availableSubtitles = [...availableSubtitles, ...additionalSubtitles.slice(0, 3)];
    } else if (popularity > 10) {
      availableSubtitles = [...availableSubtitles, ...additionalSubtitles.slice(0, 1)];
    }
    
    // Cache the result for future requests
    await storage.setCachedData({
      endpoint: cacheKey,
      data: JSON.stringify(availableSubtitles)
      // The expiresAt is handled automatically in the storage layer
    });
    
    return availableSubtitles;
  } catch (error) {
    console.error('Error determining available subtitles:', error);
    // Fall back to common subtitles in case of an error
    return ['en', 'es', 'fr'];
  }
}

// Refresh the database with popular content
export async function refreshContentDatabase(pagesToFetch = 1): Promise<{
  movies: { added: number; unavailable: number; total: number };
  tvShows: { added: number; unavailable: number; total: number };
}> {
  const results = {
    movies: { added: 0, unavailable: 0, total: 0 },
    tvShows: { added: 0, unavailable: 0, total: 0 }
  };
  
  // Fetch multiple pages if needed
  for (let page = 1; page <= pagesToFetch; page++) {
    // Fetch popular movies
    const moviesResult = await getPopularMovies(page);
    results.movies.added += moviesResult.added;
    results.movies.unavailable += moviesResult.unavailable;
    results.movies.total += moviesResult.total;
    
    // Fetch popular TV shows
    const tvShowsResult = await getPopularTVShows(page);
    results.tvShows.added += tvShowsResult.added;
    results.tvShows.unavailable += tvShowsResult.unavailable;
    results.tvShows.total += tvShowsResult.total;
  }
  
  return results;
}