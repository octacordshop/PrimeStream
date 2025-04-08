import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  isAdmin: true,
});

// Movie schema
export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imdbId: text("imdb_id").notNull().unique(),
  tmdbId: text("tmdb_id"),
  year: integer("year"),
  poster: text("poster"),
  plot: text("plot"),
  rating: text("rating"),
  runtime: text("runtime"),
  genre: text("genre"),
  director: text("director"),
  actors: text("actors"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertMovieSchema = createInsertSchema(movies).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

// TV Show schema
export const tvShows = pgTable("tv_shows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imdbId: text("imdb_id").notNull().unique(),
  tmdbId: text("tmdb_id"),
  year: text("year"),  // Can be range like "2010-2022"
  poster: text("poster"),
  plot: text("plot"),
  rating: text("rating"),
  seasons: integer("seasons"),
  genre: text("genre"),
  creator: text("creator"),
  actors: text("actors"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertTVShowSchema = createInsertSchema(tvShows).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

// Episode schema
export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull(),
  season: integer("season").notNull(),
  episode: integer("episode").notNull(),
  title: text("title").notNull(),
  imdbId: text("imdb_id"),  // Can be null if only show has ID
  plot: text("plot"),
  poster: text("poster"),
  runtime: text("runtime"),
  airDate: text("air_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
});

// Watchlist schema
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mediaType: text("media_type").notNull(), // "movie" or "tv"
  mediaId: integer("media_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
  addedAt: true,
});

// Recently watched schema
export const recentlyWatched = pgTable("recently_watched", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mediaType: text("media_type").notNull(), // "movie" or "tv"
  mediaId: integer("media_id").notNull(),
  episodeId: integer("episode_id"), // null for movies
  watchedAt: timestamp("watched_at").defaultNow().notNull(),
  progress: integer("progress").default(0), // Progress in seconds
});

export const insertRecentlyWatchedSchema = createInsertSchema(recentlyWatched).omit({
  id: true,
  watchedAt: true,
});

// API Cache schema (for storing external API responses)
export const apiCache = pgTable("api_cache", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  data: jsonb("data").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertApiCacheSchema = createInsertSchema(apiCache).omit({
  id: true,
  lastUpdated: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Movie = typeof movies.$inferSelect;
export type InsertMovie = z.infer<typeof insertMovieSchema>;

export type TVShow = typeof tvShows.$inferSelect;
export type InsertTVShow = z.infer<typeof insertTVShowSchema>;

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;

export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type RecentlyWatched = typeof recentlyWatched.$inferSelect;
export type InsertRecentlyWatched = z.infer<typeof insertRecentlyWatchedSchema>;

export type ApiCache = typeof apiCache.$inferSelect;
export type InsertApiCache = z.infer<typeof insertApiCacheSchema>;
