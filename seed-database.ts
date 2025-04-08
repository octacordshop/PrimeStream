import { db } from "./server/db";
import * as tmdbApi from "./server/tmdb-api";
import { storage } from "./server/storage";

/**
 * This script seeds the database with content from TMDB
 * to ensure the application has data to display.
 */
async function seedDatabase() {
  console.log("Starting database seeding process...");
  
  // Fetch popular movies from TMDB (page 1)
  console.log("Fetching popular movies from TMDB...");
  const moviesResult = await tmdbApi.getPopularMovies(1);
  console.log(`Processed ${moviesResult.total} movies, added ${moviesResult.added}`);
  
  // Fetch popular TV shows from TMDB (page 1)
  console.log("Fetching popular TV shows from TMDB...");
  const tvShowsResult = await tmdbApi.getPopularTVShows(1);
  console.log(`Processed ${tvShowsResult.total} TV shows, added ${tvShowsResult.added}`);
  
  // Feature some content for the homepage
  await featureRandomContent();
  
  console.log("Database seeding completed successfully!");
}

/**
 * Features random movies and TV shows
 */
async function featureRandomContent() {
  console.log("Setting featured content...");
  
  // Get some movies to feature
  const movies = await storage.getMovies(20);
  for (const movie of movies.slice(0, 5)) {
    await storage.updateMovie(movie.id, { isFeatured: true });
    console.log(`Featured movie: ${movie.title}`);
  }
  
  // Get some TV shows to feature
  const tvShows = await storage.getTVShows(20);
  for (const tvShow of tvShows.slice(0, 5)) {
    await storage.updateTVShow(tvShow.id, { isFeatured: true });
    console.log(`Featured TV show: ${tvShow.title}`);
  }
}

// Run the seeding function
seedDatabase()
  .then(() => {
    console.log("Seed script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });