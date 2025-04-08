import { db } from "./server/db";
import { movies, tvShows, episodes, watchlist, recentlyWatched, apiCache } from "./shared/schema";
import * as tmdbApi from "./server/tmdb-api";
import { storage } from "./server/storage";

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * This script cleans the database and reseeds it with fresh content
 * It specifically checks for Vidsrc.xyz availability before adding content
 * and handles rate limiting with retries and backoff
 */
async function resetDatabase() {
  console.log("Starting database reset process...");
  
  try {
    // Clean the database (keep users and sessions)
    console.log("Cleaning database...");
    await db.delete(watchlist);
    await db.delete(recentlyWatched);
    await db.delete(episodes);
    await db.delete(tvShows);
    await db.delete(movies);
    await db.delete(apiCache);
    
    console.log("Database cleaned successfully!");
    
    // Seed with popular movies from TMDB with retry logic for rate limiting
    console.log("Fetching popular movies from TMDB (checking Vidsrc.xyz availability)...");
    console.log("This may take some time as we need to make API requests for each movie...");
    
    let moviesResult;
    let retries = 0;
    while (retries < 3) {
      try {
        moviesResult = await tmdbApi.getPopularMovies(1);
        break;
      } catch (error) {
        retries++;
        console.log(`Error fetching movies, retry ${retries}/3...`);
        
        // Add exponential backoff for retries
        await sleep(5000 * retries);
        
        if (retries >= 3) {
          console.error("Failed to fetch movies after multiple attempts.");
          throw error;
        }
      }
    }
    
    if (moviesResult) {
      console.log(`Processed ${moviesResult.total} movies, added ${moviesResult.added}, unavailable: ${moviesResult.unavailable}`);
    }
    
    // Add a delay between movie and TV show processing to avoid rate limiting
    await sleep(10000);
    
    // Seed with popular TV shows from TMDB with retry logic
    console.log("Fetching popular TV shows from TMDB (checking Vidsrc.xyz availability)...");
    console.log("This may take some time as we need to make API requests for each TV show...");
    
    let tvShowsResult;
    retries = 0;
    while (retries < 3) {
      try {
        tvShowsResult = await tmdbApi.getPopularTVShows(1);
        break;
      } catch (error) {
        retries++;
        console.log(`Error fetching TV shows, retry ${retries}/3...`);
        
        // Add exponential backoff for retries
        await sleep(5000 * retries);
        
        if (retries >= 3) {
          console.error("Failed to fetch TV shows after multiple attempts.");
          throw error;
        }
      }
    }
    
    if (tvShowsResult) {
      console.log(`Processed ${tvShowsResult.total} TV shows, added ${tvShowsResult.added}, unavailable: ${tvShowsResult.unavailable}`);
    }
    
    // Feature some content for the homepage
    await featureRandomContent();
    
    console.log("Database reset and seeding completed successfully!");
  } catch (error) {
    console.error("Error resetting database:", error);
  }
}

/**
 * Features random movies and TV shows
 */
async function featureRandomContent() {
  console.log("Setting featured content...");
  
  try {
    // Get some movies to feature
    const movies = await storage.getMovies(20);
    
    if (movies.length > 0) {
      // Feature up to 5 movies or as many as available
      const moviesToFeature = movies.slice(0, Math.min(5, movies.length));
      for (const movie of moviesToFeature) {
        await storage.updateMovie(movie.id, { isFeatured: true });
        console.log(`Featured movie: ${movie.title}`);
      }
    } else {
      console.log("No movies available to feature");
    }
    
    // Get some TV shows to feature
    const tvShows = await storage.getTVShows(20);
    
    if (tvShows.length > 0) {
      // Feature up to 5 TV shows or as many as available
      const tvShowsToFeature = tvShows.slice(0, Math.min(5, tvShows.length));
      for (const tvShow of tvShowsToFeature) {
        await storage.updateTVShow(tvShow.id, { isFeatured: true });
        console.log(`Featured TV show: ${tvShow.title}`);
      }
    } else {
      console.log("No TV shows available to feature");
    }
  } catch (error) {
    console.error("Error featuring content:", error);
  }
}

// Run the reset and seeding function
resetDatabase()
  .then(() => {
    console.log("Database reset script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in database reset script:", error);
    process.exit(1);
  });