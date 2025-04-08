import {
  users, type User, type InsertUser,
  movies, type Movie, type InsertMovie,
  tvShows, type TVShow, type InsertTVShow,
  episodes, type Episode, type InsertEpisode,
  watchlist, type Watchlist, type InsertWatchlist,
  recentlyWatched, type RecentlyWatched, type InsertRecentlyWatched,
  apiCache, type ApiCache, type InsertApiCache
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Movie operations
  getMovies(limit?: number, offset?: number): Promise<Movie[]>;
  getMovie(id: number): Promise<Movie | undefined>;
  getMovieByImdbId(imdbId: string): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: number, movie: Partial<InsertMovie>): Promise<Movie | undefined>;
  deleteMovie(id: number): Promise<boolean>;
  getFeaturedMovies(limit?: number): Promise<Movie[]>;
  
  // TV Show operations
  getTVShows(limit?: number, offset?: number): Promise<TVShow[]>;
  getTVShow(id: number): Promise<TVShow | undefined>;
  getTVShowByImdbId(imdbId: string): Promise<TVShow | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private movies: Map<number, Movie>;
  private tvShows: Map<number, TVShow>;
  private episodes: Map<number, Episode>;
  private watchlists: Map<number, Watchlist>;
  private recentlyWatched: Map<number, RecentlyWatched>;
  private apiCaches: Map<string, ApiCache>;
  private currentUserIds: number;
  private currentMovieIds: number;
  private currentTVShowIds: number;
  private currentEpisodeIds: number;
  private currentWatchlistIds: number;
  private currentRecentlyWatchedIds: number;
  private currentApiCacheIds: number;

  constructor() {
    this.users = new Map();
    this.movies = new Map();
    this.tvShows = new Map();
    this.episodes = new Map();
    this.watchlists = new Map();
    this.recentlyWatched = new Map();
    this.apiCaches = new Map();
    this.currentUserIds = 1;
    this.currentMovieIds = 1;
    this.currentTVShowIds = 1;
    this.currentEpisodeIds = 1;
    this.currentWatchlistIds = 1;
    this.currentRecentlyWatchedIds = 1;
    this.currentApiCacheIds = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserIds++;
    const now = new Date();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Movie operations
  async getMovies(limit = 50, offset = 0): Promise<Movie[]> {
    return Array.from(this.movies.values())
      .filter(movie => movie.isVisible)
      .sort((a, b) => b.id - a.id)
      .slice(offset, offset + limit);
  }

  async getMovie(id: number): Promise<Movie | undefined> {
    return this.movies.get(id);
  }

  async getMovieByImdbId(imdbId: string): Promise<Movie | undefined> {
    return Array.from(this.movies.values()).find(
      (movie) => movie.imdbId === imdbId
    );
  }

  async createMovie(movie: InsertMovie): Promise<Movie> {
    const id = this.currentMovieIds++;
    const now = new Date();
    const newMovie: Movie = {
      ...movie,
      id,
      createdAt: now,
      lastUpdated: now
    };
    this.movies.set(id, newMovie);
    return newMovie;
  }

  async updateMovie(id: number, movie: Partial<InsertMovie>): Promise<Movie | undefined> {
    const existingMovie = this.movies.get(id);
    if (!existingMovie) return undefined;

    const updatedMovie: Movie = {
      ...existingMovie,
      ...movie,
      lastUpdated: new Date()
    };
    this.movies.set(id, updatedMovie);
    return updatedMovie;
  }

  async deleteMovie(id: number): Promise<boolean> {
    return this.movies.delete(id);
  }

  async getFeaturedMovies(limit = 10): Promise<Movie[]> {
    return Array.from(this.movies.values())
      .filter(movie => movie.isVisible && movie.isFeatured)
      .sort((a, b) => b.id - a.id)
      .slice(0, limit);
  }

  // TV Show operations
  async getTVShows(limit = 50, offset = 0): Promise<TVShow[]> {
    return Array.from(this.tvShows.values())
      .filter(show => show.isVisible)
      .sort((a, b) => b.id - a.id)
      .slice(offset, offset + limit);
  }

  async getTVShow(id: number): Promise<TVShow | undefined> {
    return this.tvShows.get(id);
  }

  async getTVShowByImdbId(imdbId: string): Promise<TVShow | undefined> {
    return Array.from(this.tvShows.values()).find(
      (show) => show.imdbId === imdbId
    );
  }

  async createTVShow(tvShow: InsertTVShow): Promise<TVShow> {
    const id = this.currentTVShowIds++;
    const now = new Date();
    const newTVShow: TVShow = {
      ...tvShow,
      id,
      createdAt: now,
      lastUpdated: now
    };
    this.tvShows.set(id, newTVShow);
    return newTVShow;
  }

  async updateTVShow(id: number, tvShow: Partial<InsertTVShow>): Promise<TVShow | undefined> {
    const existingTVShow = this.tvShows.get(id);
    if (!existingTVShow) return undefined;

    const updatedTVShow: TVShow = {
      ...existingTVShow,
      ...tvShow,
      lastUpdated: new Date()
    };
    this.tvShows.set(id, updatedTVShow);
    return updatedTVShow;
  }

  async deleteTVShow(id: number): Promise<boolean> {
    return this.tvShows.delete(id);
  }

  async getFeaturedTVShows(limit = 10): Promise<TVShow[]> {
    return Array.from(this.tvShows.values())
      .filter(show => show.isVisible && show.isFeatured)
      .sort((a, b) => b.id - a.id)
      .slice(0, limit);
  }

  // Episode operations
  async getEpisodes(tvShowId: number, season?: number): Promise<Episode[]> {
    return Array.from(this.episodes.values())
      .filter(episode => 
        episode.tvShowId === tvShowId && 
        (season ? episode.season === season : true)
      )
      .sort((a, b) => {
        if (a.season === b.season) {
          return a.episode - b.episode;
        }
        return a.season - b.season;
      });
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const id = this.currentEpisodeIds++;
    const now = new Date();
    const newEpisode: Episode = {
      ...episode,
      id,
      createdAt: now
    };
    this.episodes.set(id, newEpisode);
    return newEpisode;
  }

  async updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const existingEpisode = this.episodes.get(id);
    if (!existingEpisode) return undefined;

    const updatedEpisode: Episode = {
      ...existingEpisode,
      ...episode
    };
    this.episodes.set(id, updatedEpisode);
    return updatedEpisode;
  }

  async deleteEpisode(id: number): Promise<boolean> {
    return this.episodes.delete(id);
  }

  // Watchlist operations
  async getWatchlist(userId: number): Promise<Watchlist[]> {
    return Array.from(this.watchlists.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }

  async addToWatchlist(item: InsertWatchlist): Promise<Watchlist> {
    const id = this.currentWatchlistIds++;
    const now = new Date();
    const newItem: Watchlist = {
      ...item,
      id,
      addedAt: now
    };
    this.watchlists.set(id, newItem);
    return newItem;
  }

  async removeFromWatchlist(id: number): Promise<boolean> {
    return this.watchlists.delete(id);
  }

  async isInWatchlist(userId: number, mediaType: string, mediaId: number): Promise<boolean> {
    return Array.from(this.watchlists.values())
      .some(item => 
        item.userId === userId && 
        item.mediaType === mediaType && 
        item.mediaId === mediaId
      );
  }

  // Recently watched operations
  async getRecentlyWatched(userId: number, limit = 20): Promise<RecentlyWatched[]> {
    return Array.from(this.recentlyWatched.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
      .slice(0, limit);
  }

  async addToRecentlyWatched(item: InsertRecentlyWatched): Promise<RecentlyWatched> {
    // Check if this media is already in recently watched
    const existing = Array.from(this.recentlyWatched.values()).find(
      watch => 
        watch.userId === item.userId && 
        watch.mediaType === item.mediaType && 
        watch.mediaId === item.mediaId &&
        watch.episodeId === item.episodeId
    );

    if (existing) {
      // Update the watched time and progress instead of creating a new entry
      const updated: RecentlyWatched = {
        ...existing,
        watchedAt: new Date(),
        progress: item.progress || existing.progress
      };
      this.recentlyWatched.set(existing.id, updated);
      return updated;
    }

    const id = this.currentRecentlyWatchedIds++;
    const now = new Date();
    const newItem: RecentlyWatched = {
      ...item,
      id,
      watchedAt: now
    };
    this.recentlyWatched.set(id, newItem);
    return newItem;
  }

  async updateProgress(id: number, progress: number): Promise<RecentlyWatched | undefined> {
    const existing = this.recentlyWatched.get(id);
    if (!existing) return undefined;

    const updated: RecentlyWatched = {
      ...existing,
      progress,
      watchedAt: new Date() // Update the watched time as well
    };
    this.recentlyWatched.set(id, updated);
    return updated;
  }

  // API Cache operations
  async getCachedData(endpoint: string): Promise<ApiCache | undefined> {
    return this.apiCaches.get(endpoint);
  }

  async setCachedData(cache: InsertApiCache): Promise<ApiCache> {
    const existingCacheByEndpoint = Array.from(this.apiCaches.values()).find(
      entry => entry.endpoint === cache.endpoint
    );

    if (existingCacheByEndpoint) {
      // Update existing cache
      const updated: ApiCache = {
        ...existingCacheByEndpoint,
        data: cache.data,
        lastUpdated: new Date()
      };
      this.apiCaches.set(cache.endpoint, updated);
      return updated;
    }

    // Create new cache
    const id = this.currentApiCacheIds++;
    const now = new Date();
    const newCache: ApiCache = {
      ...cache,
      id,
      lastUpdated: now
    };
    this.apiCaches.set(cache.endpoint, newCache);
    return newCache;
  }

  // Search operations
  async searchContent(query: string, limit = 20): Promise<(Movie | TVShow)[]> {
    const searchTermLower = query.toLowerCase();
    
    const matchedMovies = Array.from(this.movies.values())
      .filter(movie => 
        movie.isVisible && 
        (movie.title.toLowerCase().includes(searchTermLower) ||
         (movie.plot && movie.plot.toLowerCase().includes(searchTermLower)) ||
         (movie.actors && movie.actors.toLowerCase().includes(searchTermLower)) ||
         (movie.director && movie.director.toLowerCase().includes(searchTermLower)))
      );
    
    const matchedShows = Array.from(this.tvShows.values())
      .filter(show => 
        show.isVisible && 
        (show.title.toLowerCase().includes(searchTermLower) ||
         (show.plot && show.plot.toLowerCase().includes(searchTermLower)) ||
         (show.actors && show.actors.toLowerCase().includes(searchTermLower)) ||
         (show.creator && show.creator.toLowerCase().includes(searchTermLower)))
      );
    
    // Combine and sort the results by relevance (title match first, then others)
    const combinedResults = [...matchedMovies, ...matchedShows]
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        // Exact title matches first
        if (aTitle === searchTermLower && bTitle !== searchTermLower) return -1;
        if (bTitle === searchTermLower && aTitle !== searchTermLower) return 1;
        
        // Title starts with query next
        if (aTitle.startsWith(searchTermLower) && !bTitle.startsWith(searchTermLower)) return -1;
        if (bTitle.startsWith(searchTermLower) && !aTitle.startsWith(searchTermLower)) return 1;
        
        // Then sort by title contains query
        if (aTitle.includes(searchTermLower) && !bTitle.includes(searchTermLower)) return -1;
        if (bTitle.includes(searchTermLower) && !aTitle.includes(searchTermLower)) return 1;
        
        // Finally sort alphabetically
        return aTitle.localeCompare(bTitle);
      })
      .slice(0, limit);
    
    return combinedResults;
  }
}

export const storage = new MemStorage();
