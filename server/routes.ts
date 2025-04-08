import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { 
  insertMovieSchema, insertTVShowSchema, insertEpisodeSchema,
  insertWatchlistSchema, insertRecentlyWatchedSchema
} from "@shared/schema";
import * as tmdbApi from "./tmdb-api";
import { setupAuth } from "./auth";

// Helper to safely parse JSON
const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    return null;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  const httpServer = createServer(app);

  // --- Content Endpoints ---

  // Get featured content for home page
  app.get("/api/featured", async (req, res) => {
    try {
      // Check both featured movies and TV shows
      const featuredMovies = await storage.getFeaturedMovies(1);
      const featuredTVShows = await storage.getFeaturedTVShows(1);
      
      // Prioritize featured TV shows if available (since they were likely set most recently)
      if (featuredTVShows.length > 0) {
        res.json({ featured: featuredTVShows[0], type: "tv" });
      } 
      // Then check for featured movies
      else if (featuredMovies.length > 0) {
        res.json({ featured: featuredMovies[0], type: "movie" });
      } 
      // If no featured content, get the latest movie or show as fallback
      else {
        const movies = await storage.getMovies(1);
        if (movies.length > 0) {
          res.json({ featured: movies[0], type: "movie" });
        } else {
          const shows = await storage.getTVShows(1);
          if (shows.length > 0) {
            res.json({ featured: shows[0], type: "tv" });
          } else {
            res.json({ featured: null, type: null });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching featured content:", error);
      res.status(500).json({ message: "Failed to fetch featured content" });
    }
  });

  // Get latest movies with optional genre filter
  app.get("/api/movies/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const genre = req.query.genre as string;
      
      let movies = await storage.getMovies(limit, offset);
      
      // If genre is specified, filter movies by genre
      if (genre) {
        movies = movies.filter(movie => {
          if (!movie.genre) return false;
          // Split the genre string and check if it includes the requested genre
          const genres = movie.genre.split(',').map(g => g.trim().toLowerCase());
          return genres.includes(genre.toLowerCase());
        });
      }
      
      res.json(movies);
    } catch (error) {
      console.error("Error fetching latest movies:", error);
      res.status(500).json({ message: "Failed to fetch latest movies" });
    }
  });

  // Get movie by ID
  app.get("/api/movies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movie = await storage.getMovie(id);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      res.json(movie);
    } catch (error) {
      console.error("Error fetching movie:", error);
      res.status(500).json({ message: "Failed to fetch movie" });
    }
  });

  // Get movie by IMDB ID
  app.get("/api/movies/imdb/:imdbId", async (req, res) => {
    try {
      const imdbId = req.params.imdbId;
      const movie = await storage.getMovieByImdbId(imdbId);
      
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      res.json(movie);
    } catch (error) {
      console.error("Error fetching movie by IMDB ID:", error);
      res.status(500).json({ message: "Failed to fetch movie by IMDB ID" });
    }
  });

  // Get latest TV shows with optional genre filter
  app.get("/api/tvshows/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const genre = req.query.genre as string;
      
      let shows = await storage.getTVShows(limit, offset);
      
      // If genre is specified, filter shows by genre
      if (genre) {
        shows = shows.filter(show => {
          if (!show.genre) return false;
          // Split the genre string and check if it includes the requested genre
          const genres = show.genre.split(',').map(g => g.trim().toLowerCase());
          return genres.includes(genre.toLowerCase());
        });
      }
      
      res.json(shows);
    } catch (error) {
      console.error("Error fetching latest TV shows:", error);
      res.status(500).json({ message: "Failed to fetch latest TV shows" });
    }
  });

  // Get TV show by ID
  app.get("/api/tvshows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid TV show ID" });
      }
      
      const show = await storage.getTVShow(id);
      if (!show) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      res.json(show);
    } catch (error) {
      console.error("Error fetching TV show:", error);
      res.status(500).json({ message: "Failed to fetch TV show" });
    }
  });

  // Get TV show by IMDB ID
  app.get("/api/tvshows/imdb/:imdbId", async (req, res) => {
    try {
      const imdbId = req.params.imdbId;
      const show = await storage.getTVShowByImdbId(imdbId);
      
      if (!show) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      res.json(show);
    } catch (error) {
      console.error("Error fetching TV show by IMDB ID:", error);
      res.status(500).json({ message: "Failed to fetch TV show by IMDB ID" });
    }
  });

  // Get episodes for a TV show
  app.get("/api/tvshows/:id/episodes", async (req, res) => {
    try {
      const tvShowId = parseInt(req.params.id);
      if (isNaN(tvShowId)) {
        return res.status(400).json({ message: "Invalid TV show ID" });
      }
      
      const season = req.query.season ? parseInt(req.query.season as string) : undefined;
      
      const episodes = await storage.getEpisodes(tvShowId, season);
      res.json(episodes);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      res.status(500).json({ message: "Failed to fetch episodes" });
    }
  });

  // Get episode by ID
  app.get("/api/episodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid episode ID" });
      }
      
      const episode = await storage.getEpisode(id);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      
      res.json(episode);
    } catch (error) {
      console.error("Error fetching episode:", error);
      res.status(500).json({ message: "Failed to fetch episode" });
    }
  });

  // Search for content
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const limit = parseInt(req.query.limit as string) || 20;
      const results = await storage.searchContent(query, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching content:", error);
      res.status(500).json({ message: "Failed to search content" });
    }
  });

  // --- User Interactions ---

  // Get user's watchlist (temporary userId for demo)
  app.get("/api/watchlist", async (req, res) => {
    try {
      const userId = 1; // In a real app, get from session
      const watchlist = await storage.getWatchlist(userId);
      
      // Fetch the actual content items for each watchlist entry
      const enrichedWatchlist = await Promise.all(
        watchlist.map(async (item) => {
          let content;
          if (item.mediaType === "movie") {
            content = await storage.getMovie(item.mediaId);
          } else if (item.mediaType === "tv") {
            content = await storage.getTVShow(item.mediaId);
          }
          
          return {
            ...item,
            content
          };
        })
      );
      
      res.json(enrichedWatchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  // Add item to watchlist
  app.post("/api/watchlist", async (req, res) => {
    try {
      const userId = 1; // In a real app, get from session
      const validatedData = insertWatchlistSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if already in watchlist
      const isInWatchlist = await storage.isInWatchlist(
        userId, 
        validatedData.mediaType, 
        validatedData.mediaId
      );
      
      if (isInWatchlist) {
        return res.status(400).json({ message: "Item already in watchlist" });
      }
      
      const watchlistItem = await storage.addToWatchlist(validatedData);
      res.status(201).json(watchlistItem);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  // Remove item from watchlist
  app.delete("/api/watchlist/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid watchlist item ID" });
      }
      
      const result = await storage.removeFromWatchlist(id);
      if (!result) {
        return res.status(404).json({ message: "Watchlist item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // Get user's recently watched
  app.get("/api/recently-watched", async (req, res) => {
    try {
      const userId = 1; // In a real app, get from session
      const limit = parseInt(req.query.limit as string) || 20;
      const recentlyWatched = await storage.getRecentlyWatched(userId, limit);
      
      // Fetch the actual content items for each recently watched entry
      const enrichedHistory = await Promise.all(
        recentlyWatched.map(async (item) => {
          let content;
          let episode;
          
          if (item.mediaType === "movie") {
            content = await storage.getMovie(item.mediaId);
          } else if (item.mediaType === "tv") {
            content = await storage.getTVShow(item.mediaId);
            if (item.episodeId) {
              episode = await storage.getEpisode(item.episodeId);
            }
          }
          
          return {
            ...item,
            content,
            episode
          };
        })
      );
      
      res.json(enrichedHistory);
    } catch (error) {
      console.error("Error fetching recently watched:", error);
      res.status(500).json({ message: "Failed to fetch recently watched" });
    }
  });

  // Add item to recently watched
  app.post("/api/recently-watched", async (req, res) => {
    try {
      const userId = 1; // In a real app, get from session
      const validatedData = insertRecentlyWatchedSchema.parse({
        ...req.body,
        userId
      });
      
      const recentlyWatchedItem = await storage.addToRecentlyWatched(validatedData);
      res.status(201).json(recentlyWatchedItem);
    } catch (error) {
      console.error("Error adding to recently watched:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to recently watched" });
    }
  });

  // Update progress of recently watched item
  app.patch("/api/recently-watched/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recently watched item ID" });
      }
      
      const progress = req.body.progress;
      if (typeof progress !== "number" || progress < 0) {
        return res.status(400).json({ message: "Invalid progress value" });
      }
      
      const updatedItem = await storage.updateProgress(id, progress);
      if (!updatedItem) {
        return res.status(404).json({ message: "Recently watched item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating watch progress:", error);
      res.status(500).json({ message: "Failed to update watch progress" });
    }
  });

  // --- Admin Endpoints ---

  // Create movie
  app.post("/api/admin/movies", async (req, res) => {
    try {
      const validatedData = insertMovieSchema.parse(req.body);
      const movie = await storage.createMovie(validatedData);
      res.status(201).json(movie);
    } catch (error) {
      console.error("Error creating movie:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid movie data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create movie" });
    }
  });

  // Update movie
  app.patch("/api/admin/movies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movie = await storage.updateMovie(id, req.body);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      res.json(movie);
    } catch (error) {
      console.error("Error updating movie:", error);
      res.status(500).json({ message: "Failed to update movie" });
    }
  });

  // Delete movie
  app.delete("/api/admin/movies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const result = await storage.deleteMovie(id);
      if (!result) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting movie:", error);
      res.status(500).json({ message: "Failed to delete movie" });
    }
  });

  // Create TV show
  app.post("/api/admin/tvshows", async (req, res) => {
    try {
      const validatedData = insertTVShowSchema.parse(req.body);
      const tvShow = await storage.createTVShow(validatedData);
      res.status(201).json(tvShow);
    } catch (error) {
      console.error("Error creating TV show:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid TV show data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create TV show" });
    }
  });

  // Update TV show
  app.patch("/api/admin/tvshows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid TV show ID" });
      }
      
      const tvShow = await storage.updateTVShow(id, req.body);
      if (!tvShow) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      res.json(tvShow);
    } catch (error) {
      console.error("Error updating TV show:", error);
      res.status(500).json({ message: "Failed to update TV show" });
    }
  });

  // Delete TV show
  app.delete("/api/admin/tvshows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid TV show ID" });
      }
      
      const result = await storage.deleteTVShow(id);
      if (!result) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting TV show:", error);
      res.status(500).json({ message: "Failed to delete TV show" });
    }
  });

  // Create episode
  app.post("/api/admin/episodes", async (req, res) => {
    try {
      const validatedData = insertEpisodeSchema.parse(req.body);
      const episode = await storage.createEpisode(validatedData);
      res.status(201).json(episode);
    } catch (error) {
      console.error("Error creating episode:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid episode data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create episode" });
    }
  });

  // --- API Integration Endpoints ---

  // Fetch and store latest movies from Vidsrc
  app.post("/api/admin/fetch/movies", async (req, res) => {
    try {
      const page = req.query.page || 1;
      const endpoint = `https://vidsrc.xyz/movies/latest/page-${page}.json`;
      
      let moviesData;
      
      // Check for cached data first
      const cachedData = await storage.getCachedData(endpoint);
      if (cachedData && (new Date().getTime() - new Date(cachedData.lastUpdated).getTime() < 3600000)) {
        // If cache is less than 1 hour old, use it
        moviesData = cachedData.data;
      } else {
        // Otherwise, fetch from API
        const response = await axios.get(endpoint);
        moviesData = response.data;
        
        // Store in cache
        await storage.setCachedData({
          endpoint,
          data: moviesData
        });
      }
      
      // Process and store movies
      const results = [];
      
      if (Array.isArray(moviesData)) {
        for (const movieData of moviesData) {
          // Check if movie already exists
          const existingMovie = await storage.getMovieByImdbId(movieData.imdb_id);
          
          if (existingMovie) {
            // Update existing movie
            const updatedMovie = await storage.updateMovie(existingMovie.id, {
              title: movieData.title,
              poster: movieData.poster,
              year: parseInt(movieData.year),
              plot: movieData.plot || existingMovie.plot,
              rating: movieData.rating || existingMovie.rating,
              genre: movieData.genre || existingMovie.genre,
              director: movieData.director || existingMovie.director,
              actors: movieData.actors || existingMovie.actors
            });
            
            results.push({ movie: updatedMovie, status: 'updated' });
          } else {
            // Create new movie
            const newMovie = await storage.createMovie({
              title: movieData.title,
              imdbId: movieData.imdb_id,
              tmdbId: movieData.tmdb_id || null,
              year: parseInt(movieData.year),
              poster: movieData.poster,
              plot: movieData.plot || null,
              rating: movieData.rating || null,
              runtime: movieData.runtime || null,
              genre: movieData.genre || null,
              director: movieData.director || null,
              actors: movieData.actors || null,
              isFeatured: false,
              isVisible: true
            });
            
            results.push({ movie: newMovie, status: 'created' });
          }
        }
      }
      
      res.json({
        fetched: moviesData?.length || 0,
        processed: results.length,
        results
      });
    } catch (error) {
      console.error("Error fetching and storing movies:", error);
      res.status(500).json({ message: "Failed to fetch and store movies", error: error.message });
    }
  });

  // Fetch and store latest TV shows from Vidsrc
  app.post("/api/admin/fetch/tvshows", async (req, res) => {
    try {
      const page = req.query.page || 1;
      const endpoint = `https://vidsrc.xyz/tvshows/latest/page-${page}.json`;
      
      let showsData;
      
      // Check for cached data first
      const cachedData = await storage.getCachedData(endpoint);
      if (cachedData && (new Date().getTime() - new Date(cachedData.lastUpdated).getTime() < 3600000)) {
        // If cache is less than 1 hour old, use it
        showsData = cachedData.data;
      } else {
        // Otherwise, fetch from API
        const response = await axios.get(endpoint);
        showsData = response.data;
        
        // Store in cache
        await storage.setCachedData({
          endpoint,
          data: showsData
        });
      }
      
      // Process and store TV shows
      const results = [];
      
      if (Array.isArray(showsData)) {
        for (const showData of showsData) {
          // Check if show already exists
          const existingShow = await storage.getTVShowByImdbId(showData.imdb_id);
          
          if (existingShow) {
            // Update existing show
            const updatedShow = await storage.updateTVShow(existingShow.id, {
              title: showData.title,
              poster: showData.poster,
              year: showData.year,
              seasons: showData.seasons || existingShow.seasons,
              plot: showData.plot || existingShow.plot,
              rating: showData.rating || existingShow.rating,
              genre: showData.genre || existingShow.genre,
              creator: showData.creator || existingShow.creator,
              actors: showData.actors || existingShow.actors
            });
            
            results.push({ show: updatedShow, status: 'updated' });
          } else {
            // Create new show
            const newShow = await storage.createTVShow({
              title: showData.title,
              imdbId: showData.imdb_id,
              tmdbId: showData.tmdb_id || null,
              year: showData.year,
              poster: showData.poster,
              plot: showData.plot || null,
              rating: showData.rating || null,
              seasons: showData.seasons || null,
              genre: showData.genre || null,
              creator: showData.creator || null,
              actors: showData.actors || null,
              isFeatured: false,
              isVisible: true
            });
            
            results.push({ show: newShow, status: 'created' });
          }
        }
      }
      
      res.json({
        fetched: showsData?.length || 0,
        processed: results.length,
        results
      });
    } catch (error) {
      console.error("Error fetching and storing TV shows:", error);
      res.status(500).json({ message: "Failed to fetch and store TV shows", error: error.message });
    }
  });

  // Fetch and store latest episodes from Vidsrc
  app.post("/api/admin/fetch/episodes", async (req, res) => {
    try {
      const page = req.query.page || 1;
      const endpoint = `https://vidsrc.xyz/episodes/latest/page-${page}.json`;
      
      let episodesData;
      
      // Check for cached data first
      const cachedData = await storage.getCachedData(endpoint);
      if (cachedData && (new Date().getTime() - new Date(cachedData.lastUpdated).getTime() < 3600000)) {
        // If cache is less than 1 hour old, use it
        episodesData = safeJsonParse(cachedData.data);
      } else {
        // Otherwise, fetch from API
        const response = await axios.get(endpoint);
        episodesData = response.data;
        
        // Store in cache
        await storage.setCachedData({
          endpoint,
          data: JSON.stringify(episodesData)
        });
      }
      
      // Process and store episodes
      const results = [];
      
      if (Array.isArray(episodesData)) {
        for (const episodeData of episodesData) {
          // First, check if we have the TV show
          const tvShow = await storage.getTVShowByImdbId(episodeData.show_imdb_id);
          
          if (!tvShow) {
            // Skip episodes for shows we don't have
            results.push({ 
              episode: episodeData, 
              status: 'skipped', 
              reason: 'TV show not found' 
            });
            continue;
          }
          
          // Check if this episode already exists
          const existingEpisodes = await storage.getEpisodes(tvShow.id, episodeData.season);
          const existingEpisode = existingEpisodes.find(
            e => e.season === episodeData.season && e.episode === episodeData.episode
          );
          
          if (existingEpisode) {
            // Update existing episode
            const updatedEpisode = await storage.updateEpisode(existingEpisode.id, {
              title: episodeData.title,
              plot: episodeData.plot,
              poster: episodeData.poster,
              runtime: episodeData.runtime,
              airDate: episodeData.air_date,
              imdbId: episodeData.imdb_id
            });
            
            results.push({ episode: updatedEpisode, status: 'updated' });
          } else {
            // Create new episode
            const newEpisode = await storage.createEpisode({
              tvShowId: tvShow.id,
              season: episodeData.season,
              episode: episodeData.episode,
              title: episodeData.title,
              plot: episodeData.plot || null,
              poster: episodeData.poster || null,
              runtime: episodeData.runtime || null,
              airDate: episodeData.air_date || null,
              imdbId: episodeData.imdb_id || null
            });
            
            results.push({ episode: newEpisode, status: 'created' });
          }
        }
      }
      
      res.json({
        fetched: episodesData?.length || 0,
        processed: results.length,
        results
      });
    } catch (error) {
      console.error("Error fetching and storing episodes:", error);
      res.status(500).json({ message: "Failed to fetch and store episodes", error: error.message });
    }
  });

  // Refresh all content from Vidsrc (movies, TV shows, episodes)
  app.post("/api/admin/refresh-content", async (req, res) => {
    try {
      const pagesToFetch = req.query.pages ? parseInt(req.query.pages as string) : 1;
      
      // Import the refreshContentDatabase function from vidsrc-api.ts
      const { refreshContentDatabase } = await import('./vidsrc-api');
      
      // Call the function to refresh content
      const results = await refreshContentDatabase(pagesToFetch);
      
      // Return the results
      res.json({
        success: true,
        message: "Content refreshed successfully",
        results
      });
    } catch (error) {
      console.error("Error refreshing content:", error);
      res.status(500).json({ message: "Failed to refresh content", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // --- TMDB API Integration ---

  // Get available subtitles for a movie or TV show
  app.get("/api/subtitles/:type/:imdbId", async (req, res) => {
    try {
      const { type, imdbId } = req.params;
      if (type !== 'movie' && type !== 'tv') {
        return res.status(400).json({ message: "Type must be 'movie' or 'tv'" });
      }
      
      const subtitles = await tmdbApi.getAvailableSubtitles(type as 'movie' | 'tv', imdbId);
      res.json(subtitles);
    } catch (error) {
      console.error("Error fetching subtitles:", error);
      res.status(500).json({ message: "Failed to fetch available subtitles" });
    }
  });

  // --- TMDB Admin Endpoints ---

  // Fetch popular movies from TMDB
  app.post("/api/admin/tmdb/fetch-popular-movies", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await tmdbApi.getPopularMovies(page);
      res.json(result);
    } catch (error) {
      console.error("Error fetching popular movies from TMDB:", error);
      res.status(500).json({ message: "Failed to fetch popular movies from TMDB" });
    }
  });

  // Fetch popular TV shows from TMDB
  app.post("/api/admin/tmdb/fetch-popular-tvshows", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await tmdbApi.getPopularTVShows(page);
      res.json(result);
    } catch (error) {
      console.error("Error fetching popular TV shows from TMDB:", error);
      res.status(500).json({ message: "Failed to fetch popular TV shows from TMDB" });
    }
  });

  // Fetch movies from TMDB by year
  app.post("/api/admin/tmdb/fetch-movies-by-year", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        return res.status(400).json({ message: "Invalid year provided" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const result = await tmdbApi.discoverMoviesByYear(year, page);
      res.json(result);
    } catch (error) {
      console.error("Error fetching movies by year from TMDB:", error);
      res.status(500).json({ message: "Failed to fetch movies by year from TMDB" });
    }
  });

  // Fetch TV shows from TMDB by year
  app.post("/api/admin/tmdb/fetch-tvshows-by-year", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        return res.status(400).json({ message: "Invalid year provided" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const result = await tmdbApi.discoverTVShowsByYear(year, page);
      res.json(result);
    } catch (error) {
      console.error("Error fetching TV shows by year from TMDB:", error);
      res.status(500).json({ message: "Failed to fetch TV shows by year from TMDB" });
    }
  });

  // Refresh content database with popular content
  app.post("/api/admin/tmdb/refresh-content", async (req, res) => {
    try {
      const pages = parseInt(req.query.pages as string) || 1;
      const result = await tmdbApi.refreshContentDatabase(pages);
      res.json(result);
    } catch (error) {
      console.error("Error refreshing content from TMDB:", error);
      res.status(500).json({ message: "Failed to refresh content from TMDB" });
    }
  });
  
  // Add a subtitles route to fetch available subtitles
  app.get("/api/subtitles/:contentType/:imdbId", async (req, res) => {
    try {
      const { contentType, imdbId } = req.params;
      
      if (!contentType || !imdbId || !['movie', 'tv'].includes(contentType)) {
        return res.status(400).json({ message: "Valid contentType and imdbId parameters are required" });
      }
      
      const subtitles = await tmdbApi.getAvailableSubtitles(contentType as 'movie' | 'tv', imdbId);
      res.json(subtitles);
    } catch (error) {
      console.error("Error fetching available subtitles:", error);
      res.status(500).json({ message: "Failed to fetch subtitles" });
    }
  });
  
  // Import movies from TMDB by year (direct API endpoint for admin panel)
  app.post("/api/admin/tmdb/movies/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const page = parseInt(req.query.page as string) || 1;
      
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        return res.status(400).json({ message: "Valid year parameter is required (1900 - current year)" });
      }
      
      const result = await tmdbApi.discoverMoviesByYear(year, page);
      res.json(result);
    } catch (error) {
      console.error("Error fetching movies by year from TMDB:", error);
      res.status(500).json({ message: "Failed to fetch movies by year from TMDB" });
    }
  });
  
  // Import TV shows from TMDB by year (direct API endpoint for admin panel)
  app.post("/api/admin/tmdb/tvshows/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const page = parseInt(req.query.page as string) || 1;
      
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        return res.status(400).json({ message: "Valid year parameter is required (1900 - current year)" });
      }
      
      const result = await tmdbApi.discoverTVShowsByYear(year, page);
      res.json(result);
    } catch (error) {
      console.error("Error fetching TV shows by year from TMDB:", error);
      res.status(500).json({ message: "Failed to fetch TV shows by year from TMDB" });
    }
  });
  
  // --- Hero Content and Settings Endpoints ---
  
  // Bulk feature content
  app.post("/api/admin/feature/bulk", async (req, res) => {
    try {
      const { type, ids, featured } = req.body;
      
      if (!type || !ids || !Array.isArray(ids) || ids.length === 0 || featured === undefined) {
        return res.status(400).json({ message: "Invalid feature data" });
      }
      
      if (!["movie", "tv"].includes(type)) {
        return res.status(400).json({ message: "Type must be either 'movie' or 'tv'" });
      }
      
      const updatedItems = [];
      
      if (type === "movie") {
        for (const id of ids) {
          try {
            const movie = await storage.updateMovie(id, { isFeatured: featured });
            if (movie) {
              updatedItems.push(movie);
            }
          } catch (err) {
            console.error(`Error updating movie ${id}:`, err);
          }
        }
      } else {
        for (const id of ids) {
          try {
            const tvShow = await storage.updateTVShow(id, { isFeatured: featured });
            if (tvShow) {
              updatedItems.push(tvShow);
            }
          } catch (err) {
            console.error(`Error updating TV show ${id}:`, err);
          }
        }
      }
      
      res.json({ 
        message: `${featured ? 'Featured' : 'Unfeatured'} ${updatedItems.length} items successfully`,
        updatedItems 
      });
    } catch (error) {
      console.error("Error bulk featuring content:", error);
      res.status(500).json({ message: "Failed to bulk update featured status" });
    }
  });
  
  // Set hero content
  app.post("/api/admin/hero", async (req, res) => {
    try {
      const { type, id } = req.body;
      
      if (!type || !id || !["movie", "tv"].includes(type)) {
        return res.status(400).json({ message: "Invalid hero content data" });
      }
      
      // First, unfeature all content
      if (type === "movie") {
        // Get all featured movies and unfeature them
        const featuredMovies = await storage.getFeaturedMovies(50);
        for (const movie of featuredMovies) {
          await storage.updateMovie(movie.id, { isFeatured: false });
        }
        
        // Feature the selected movie
        const movie = await storage.updateMovie(id, { isFeatured: true });
        if (!movie) {
          return res.status(404).json({ message: "Movie not found" });
        }
        
        res.json({ message: "Hero content updated successfully", content: movie });
      } else {
        // Get all featured TV shows and unfeature them
        const featuredTVShows = await storage.getFeaturedTVShows(50);
        for (const show of featuredTVShows) {
          await storage.updateTVShow(show.id, { isFeatured: false });
        }
        
        // Feature the selected TV show
        const tvShow = await storage.updateTVShow(id, { isFeatured: true });
        if (!tvShow) {
          return res.status(404).json({ message: "TV show not found" });
        }
        
        res.json({ message: "Hero content updated successfully", content: tvShow });
      }
    } catch (error) {
      console.error("Error updating hero content:", error);
      res.status(500).json({ message: "Failed to update hero content" });
    }
  });
  
  // Save auto-fetch settings
  app.post("/api/admin/settings", async (req, res) => {
    try {
      const { autoFetch } = req.body;
      
      if (!autoFetch) {
        return res.status(400).json({ message: "Invalid settings data" });
      }
      
      // In a real app, we would save these settings to the database
      // For now, we'll just respond with success
      
      res.json({ 
        message: "Settings saved successfully", 
        settings: { 
          autoFetch
        }
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  return httpServer;
}
