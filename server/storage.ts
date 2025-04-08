import { eq, and, like, desc, sql } from 'drizzle-orm';
import { db } from './db';
import { pool } from './db';
import { 
  users, movies, tvShows, episodes, watchlist, recentlyWatched, apiCache,
  type User, type InsertUser,
  type Movie, type InsertMovie,
  type TVShow, type InsertTVShow,
  type Episode, type InsertEpisode,
  type Watchlist, type InsertWatchlist,
  type RecentlyWatched, type InsertRecentlyWatched,
  type ApiCache, type InsertApiCache
} from '@shared/schema';
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // Session store
  sessionStore: any; // Using any for session store to avoid type issues

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Movie operations
  getMovies(limit?: number, offset?: number): Promise<Movie[]>;
  getMovie(id: number): Promise<Movie | undefined>;
  getMovieByImdbId(imdbId: string): Promise<Movie | undefined>;
  getMovieByTmdbId(tmdbId: string): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: number, movie: Partial<InsertMovie>): Promise<Movie | undefined>;
  deleteMovie(id: number): Promise<boolean>;
  getFeaturedMovies(limit?: number): Promise<Movie[]>;
  
  // TV Show operations
  getTVShows(limit?: number, offset?: number): Promise<TVShow[]>;
  getTVShow(id: number): Promise<TVShow | undefined>;
  getTVShowByImdbId(imdbId: string): Promise<TVShow | undefined>;
  getTVShowByTmdbId(tmdbId: string): Promise<TVShow | undefined>;
  createTVShow(tvShow: InsertTVShow): Promise<TVShow>;
  updateTVShow(id: number, tvShow: Partial<InsertTVShow>): Promise<TVShow | undefined>;
  deleteTVShow(id: number): Promise<boolean>;
  getFeaturedTVShows(limit?: number): Promise<TVShow[]>;
  
  // Episode operations
  getEpisodes(tvShowId: number, season?: number): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined>;
  deleteEpisode(id: number): Promise<boolean>;
  
  // Watchlist operations
  getWatchlist(userId: number): Promise<Watchlist[]>;
  addToWatchlist(item: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(id: number): Promise<boolean>;
  isInWatchlist(userId: number, mediaType: string, mediaId: number): Promise<boolean>;
  
  // Recently watched operations
  getRecentlyWatched(userId: number, limit?: number): Promise<RecentlyWatched[]>;
  addToRecentlyWatched(item: InsertRecentlyWatched): Promise<RecentlyWatched>;
  updateProgress(id: number, progress: number): Promise<RecentlyWatched | undefined>;
  
  // API Cache operations
  getCachedData(endpoint: string): Promise<ApiCache | undefined>;
  setCachedData(cache: InsertApiCache): Promise<ApiCache>;
  
  // Search operations
  searchContent(query: string, limit?: number): Promise<(Movie | TVShow)[]>;
}

export class DatabaseStorage implements IStorage {
  // Session store
  sessionStore: any; // Using any for session store to avoid type issues

  constructor() {
    const PostgresSessionStore = connectPg(session);
    
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Movie operations
  async getMovies(limit = 50, offset = 0): Promise<Movie[]> {
    return db.select()
      .from(movies)
      .where(eq(movies.isVisible, true))
      .orderBy(desc(movies.lastUpdated))
      .limit(limit)
      .offset(offset);
  }

  async getMovie(id: number): Promise<Movie | undefined> {
    const [movie] = await db.select()
      .from(movies)
      .where(eq(movies.id, id));
    return movie;
  }

  async getMovieByImdbId(imdbId: string): Promise<Movie | undefined> {
    const [movie] = await db.select()
      .from(movies)
      .where(eq(movies.imdbId, imdbId));
    return movie;
  }
  
  async getMovieByTmdbId(tmdbId: string): Promise<Movie | undefined> {
    const [movie] = await db.select()
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId));
    return movie;
  }

  async createMovie(movie: InsertMovie): Promise<Movie> {
    const [newMovie] = await db.insert(movies)
      .values({
        ...movie,
        createdAt: new Date(),
        lastUpdated: new Date()
      })
      .returning();
    return newMovie;
  }

  async updateMovie(id: number, movie: Partial<InsertMovie>): Promise<Movie | undefined> {
    const [updatedMovie] = await db.update(movies)
      .set({
        ...movie,
        lastUpdated: new Date()
      })
      .where(eq(movies.id, id))
      .returning();
    return updatedMovie;
  }

  async deleteMovie(id: number): Promise<boolean> {
    await db.delete(movies)
      .where(eq(movies.id, id));
    return true;
  }

  async getFeaturedMovies(limit = 10): Promise<Movie[]> {
    return db.select()
      .from(movies)
      .where(and(
        eq(movies.isVisible, true),
        eq(movies.isFeatured, true)
      ))
      .limit(limit);
  }

  // TV Show operations
  async getTVShows(limit = 50, offset = 0): Promise<TVShow[]> {
    return db.select()
      .from(tvShows)
      .where(eq(tvShows.isVisible, true))
      .orderBy(desc(tvShows.lastUpdated))
      .limit(limit)
      .offset(offset);
  }

  async getTVShow(id: number): Promise<TVShow | undefined> {
    const [tvShow] = await db.select()
      .from(tvShows)
      .where(eq(tvShows.id, id));
    return tvShow;
  }

  async getTVShowByImdbId(imdbId: string): Promise<TVShow | undefined> {
    const [tvShow] = await db.select()
      .from(tvShows)
      .where(eq(tvShows.imdbId, imdbId));
    return tvShow;
  }
  
  async getTVShowByTmdbId(tmdbId: string): Promise<TVShow | undefined> {
    const [tvShow] = await db.select()
      .from(tvShows)
      .where(eq(tvShows.tmdbId, tmdbId));
    return tvShow;
  }

  async createTVShow(tvShow: InsertTVShow): Promise<TVShow> {
    const [newTVShow] = await db.insert(tvShows)
      .values({
        ...tvShow,
        createdAt: new Date(),
        lastUpdated: new Date()
      })
      .returning();
    return newTVShow;
  }

  async updateTVShow(id: number, tvShow: Partial<InsertTVShow>): Promise<TVShow | undefined> {
    const [updatedTVShow] = await db.update(tvShows)
      .set({
        ...tvShow,
        lastUpdated: new Date()
      })
      .where(eq(tvShows.id, id))
      .returning();
    return updatedTVShow;
  }

  async deleteTVShow(id: number): Promise<boolean> {
    await db.delete(tvShows)
      .where(eq(tvShows.id, id));
    return true;
  }

  async getFeaturedTVShows(limit = 10): Promise<TVShow[]> {
    return db.select()
      .from(tvShows)
      .where(and(
        eq(tvShows.isVisible, true),
        eq(tvShows.isFeatured, true)
      ))
      .limit(limit);
  }

  // Episode operations
  async getEpisodes(tvShowId: number, season?: number): Promise<Episode[]> {
    if (season !== undefined) {
      return db.select()
        .from(episodes)
        .where(and(
          eq(episodes.tvShowId, tvShowId),
          eq(episodes.season, season)
        ))
        .orderBy(episodes.season, episodes.episode);
    }
    
    return db.select()
      .from(episodes)
      .where(eq(episodes.tvShowId, tvShowId))
      .orderBy(episodes.season, episodes.episode);
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const [episode] = await db.select()
      .from(episodes)
      .where(eq(episodes.id, id));
    return episode;
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const [newEpisode] = await db.insert(episodes)
      .values({
        ...episode,
        createdAt: new Date()
      })
      .returning();
    return newEpisode;
  }

  async updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const [updatedEpisode] = await db.update(episodes)
      .set(episode)
      .where(eq(episodes.id, id))
      .returning();
    return updatedEpisode;
  }

  async deleteEpisode(id: number): Promise<boolean> {
    await db.delete(episodes)
      .where(eq(episodes.id, id));
    return true;
  }

  // Watchlist operations
  async getWatchlist(userId: number): Promise<Watchlist[]> {
    return db.select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.addedAt));
  }

  async addToWatchlist(item: InsertWatchlist): Promise<Watchlist> {
    const [newItem] = await db.insert(watchlist)
      .values({
        ...item,
        addedAt: new Date()
      })
      .returning();
    return newItem;
  }

  async removeFromWatchlist(id: number): Promise<boolean> {
    await db.delete(watchlist)
      .where(eq(watchlist.id, id));
    return true;
  }

  async isInWatchlist(userId: number, mediaType: string, mediaId: number): Promise<boolean> {
    const items = await db.select({ id: watchlist.id })
      .from(watchlist)
      .where(and(
        eq(watchlist.userId, userId),
        eq(watchlist.mediaType, mediaType),
        eq(watchlist.mediaId, mediaId)
      ));
    return items.length > 0;
  }

  // Recently watched operations
  async getRecentlyWatched(userId: number, limit = 20): Promise<RecentlyWatched[]> {
    return db.select()
      .from(recentlyWatched)
      .where(eq(recentlyWatched.userId, userId))
      .orderBy(desc(recentlyWatched.watchedAt))
      .limit(limit);
  }

  async addToRecentlyWatched(item: InsertRecentlyWatched): Promise<RecentlyWatched> {
    // Check if an entry already exists
    const [existing] = await db.select()
      .from(recentlyWatched)
      .where(and(
        eq(recentlyWatched.userId, item.userId),
        eq(recentlyWatched.mediaType, item.mediaType),
        eq(recentlyWatched.mediaId, item.mediaId),
        item.episodeId 
          ? eq(recentlyWatched.episodeId, item.episodeId) 
          : sql`${recentlyWatched.episodeId} IS NULL`
      ));
    
    if (existing) {
      // Update existing entry
      const [updated] = await db.update(recentlyWatched)
        .set({
          progress: item.progress,
          watchedAt: new Date()
        })
        .where(eq(recentlyWatched.id, existing.id))
        .returning();
      return updated;
    }
    
    // Create new entry
    const [newItem] = await db.insert(recentlyWatched)
      .values({
        ...item,
        watchedAt: new Date()
      })
      .returning();
    return newItem;
  }

  async updateProgress(id: number, progress: number): Promise<RecentlyWatched | undefined> {
    const [updated] = await db.update(recentlyWatched)
      .set({
        progress,
        watchedAt: new Date()
      })
      .where(eq(recentlyWatched.id, id))
      .returning();
    return updated;
  }

  // API Cache operations
  async getCachedData(endpoint: string): Promise<ApiCache | undefined> {
    const [cache] = await db.select()
      .from(apiCache)
      .where(eq(apiCache.endpoint, endpoint));
    return cache;
  }

  async setCachedData(cache: InsertApiCache): Promise<ApiCache> {
    // Check if cache exists
    const [existing] = await db.select()
      .from(apiCache)
      .where(eq(apiCache.endpoint, cache.endpoint));
    
    if (existing) {
      // Update existing cache
      const [updated] = await db.update(apiCache)
        .set({
          data: cache.data,
          lastUpdated: new Date()
        })
        .where(eq(apiCache.id, existing.id))
        .returning();
      return updated;
    }
    
    // Create new cache
    const [newCache] = await db.insert(apiCache)
      .values({
        ...cache,
        lastUpdated: new Date()
      })
      .returning();
    return newCache;
  }

  // Search operations
  async searchContent(query: string, limit = 20): Promise<(Movie | TVShow)[]> {
    // Search in movies
    const movieResults = await db.select()
      .from(movies)
      .where(and(
        eq(movies.isVisible, true),
        like(movies.title, `%${query}%`)
      ))
      .limit(limit);
    
    // Search in TV shows
    const tvResults = await db.select()
      .from(tvShows)
      .where(and(
        eq(tvShows.isVisible, true),
        like(tvShows.title, `%${query}%`)
      ))
      .limit(limit);
    
    // Combine results
    return [...movieResults, ...tvResults].slice(0, limit);
  }
}

// Export a singleton instance of the storage class
export const storage = new DatabaseStorage();