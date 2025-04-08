import { db } from "./server/db";
import axios from "axios";
import { movies, tvShows } from "./shared/schema";
import { storage } from "./server/storage";

/**
 * This script quickly seeds the database with TMDB content
 * without checking Vidsrc availability
 */
async function quickSeed() {
  console.log("Starting quick database seeding process...");
  
  // Import popular movies
  await importPopularMovies();
  
  // Import popular TV shows
  await importPopularTVShows();
  
  // Feature some content
  await featureContent();
  
  console.log("Quick seeding completed!");
}

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY as string;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN as string;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

async function importPopularMovies() {
  console.log("Importing popular movies...");
  
  try {
    const response = await axios.get(`${TMDB_API_BASE_URL}/movie/popular`, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json;charset=utf-8"
      },
      params: {
        api_key: TMDB_API_KEY,
        page: 1
      }
    });
    
    const moviesData = response.data.results;
    let added = 0;
    
    for (const movie of moviesData) {
      try {
        // Check if the movie already exists
        const existingMovie = await storage.getMovieByTmdbId(movie.id.toString());
        if (existingMovie) {
          console.log(`Movie ${movie.title} already exists, skipping`);
          continue;
        }
        
        // Format the movie data
        const posterPath = movie.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
          : null;
          
        const formattedMovie = {
          title: movie.title,
          tmdbId: movie.id.toString(),
          imdbId: `tt${Math.floor(Math.random() * 10000000) + 10000000}`, // Generate dummy IMDb ID
          year: new Date(movie.release_date).getFullYear() || null,
          poster: posterPath,
          plot: movie.overview,
          isFeatured: false,
          isVisible: true
        };
        
        // Add the movie to the database
        await storage.createMovie(formattedMovie);
        added++;
        console.log(`Added movie: ${movie.title}`);
      } catch (error) {
        console.error(`Failed to add movie ${movie.title}:`, error);
      }
    }
    
    console.log(`Successfully added ${added} new movies`);
    return added;
  } catch (error) {
    console.error("Error importing popular movies:", error);
    return 0;
  }
}

async function importPopularTVShows() {
  console.log("Importing popular TV shows...");
  
  try {
    const response = await axios.get(`${TMDB_API_BASE_URL}/tv/popular`, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json;charset=utf-8"
      },
      params: {
        api_key: TMDB_API_KEY,
        page: 1
      }
    });
    
    const tvShowsData = response.data.results;
    let added = 0;
    
    for (const tvShow of tvShowsData) {
      try {
        // Check if the TV show already exists
        const existingTVShow = await storage.getTVShowByTmdbId(tvShow.id.toString());
        if (existingTVShow) {
          console.log(`TV show ${tvShow.name} already exists, skipping`);
          continue;
        }
        
        // Format the TV show data
        const posterPath = tvShow.poster_path 
          ? `${TMDB_IMAGE_BASE_URL}${tvShow.poster_path}` 
          : null;
          
        const startYear = tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : null;
        const endYear = tvShow.last_air_date ? new Date(tvShow.last_air_date).getFullYear() : null;
        const yearString = startYear === endYear || !endYear 
          ? startYear?.toString() 
          : `${startYear}-${endYear}`;
        
        const formattedTVShow = {
          title: tvShow.name,
          tmdbId: tvShow.id.toString(),
          imdbId: `tt${Math.floor(Math.random() * 10000000) + 10000000}`, // Generate dummy IMDb ID
          year: yearString || null,
          poster: posterPath,
          plot: tvShow.overview,
          seasons: tvShow.number_of_seasons || 1,
          isFeatured: false,
          isVisible: true
        };
        
        // Add the TV show to the database
        await storage.createTVShow(formattedTVShow);
        added++;
        console.log(`Added TV show: ${tvShow.name}`);
      } catch (error) {
        console.error(`Failed to add TV show ${tvShow.name}:`, error);
      }
    }
    
    console.log(`Successfully added ${added} new TV shows`);
    return added;
  } catch (error) {
    console.error("Error importing popular TV shows:", error);
    return 0;
  }
}

async function featureContent() {
  console.log("Setting featured content...");
  
  try {
    // Feature some movies
    const allMovies = await storage.getMovies(20);
    for (const movie of allMovies.slice(0, 5)) {
      await storage.updateMovie(movie.id, { isFeatured: true });
      console.log(`Featured movie: ${movie.title}`);
    }
    
    // Feature some TV shows
    const allTVShows = await storage.getTVShows(20);
    for (const tvShow of allTVShows.slice(0, 5)) {
      await storage.updateTVShow(tvShow.id, { isFeatured: true });
      console.log(`Featured TV show: ${tvShow.title}`);
    }
  } catch (error) {
    console.error("Error featuring content:", error);
  }
}

// Run the quick seed function
quickSeed()
  .then(() => {
    console.log("Quick seed script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in quick seed script:", error);
    process.exit(1);
  });