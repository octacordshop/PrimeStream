import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, Pool } from '@neondatabase/serverless';
import * as schema from './shared/schema';
import ws from 'ws';
import { sql } from 'drizzle-orm';

async function main() {
  // Set up WebSocket for Neon Serverless
  (globalThis as any).WebSocket = ws;

  // Initialize the connection pool
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  console.log('Connecting to the database...');

  // Use the recommended method for Neon Serverless
  const sqlClient = neon(connectionString);
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  console.log('Creating schema tables...');

  try {
    // Create users table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('Created users table');

    // Create movies table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        imdb_id TEXT NOT NULL UNIQUE,
        tmdb_id TEXT,
        year INTEGER,
        poster TEXT,
        plot TEXT,
        rating TEXT,
        runtime TEXT,
        genre TEXT,
        director TEXT,
        actors TEXT,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_visible BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_updated TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('Created movies table');

    // Create tv_shows table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS tv_shows (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        imdb_id TEXT NOT NULL UNIQUE,
        tmdb_id TEXT,
        year TEXT,
        poster TEXT,
        plot TEXT,
        rating TEXT,
        seasons INTEGER,
        genre TEXT,
        creator TEXT,
        actors TEXT,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_visible BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_updated TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('Created tv_shows table');

    // Create episodes table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS episodes (
        id SERIAL PRIMARY KEY,
        tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
        season INTEGER NOT NULL,
        episode INTEGER NOT NULL,
        title TEXT NOT NULL,
        imdb_id TEXT,
        plot TEXT,
        poster TEXT,
        runtime TEXT,
        air_date TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(tv_show_id, season, episode)
      )
    `;
    console.log('Created episodes table');

    // Create watchlist table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS watchlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_type TEXT NOT NULL,
        media_id INTEGER NOT NULL,
        added_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, media_type, media_id)
      )
    `;
    console.log('Created watchlist table');

    // Create recently_watched table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS recently_watched (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_type TEXT NOT NULL,
        media_id INTEGER NOT NULL,
        episode_id INTEGER,
        progress INTEGER NOT NULL DEFAULT 0,
        watched_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, media_type, media_id, episode_id)
      )
    `;
    console.log('Created recently_watched table');

    // Create api_cache table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS api_cache (
        id SERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('Created api_cache table');

    // Insert admin user
    await sqlClient`
      INSERT INTO users (username, email, password, role)
      VALUES ('admin', 'admin@example.com', 'admin', 'admin')
      ON CONFLICT (username) DO NOTHING
    `;
    console.log('Added admin user');

    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error creating schema:', error);
  } finally {
    await pool.end();
  }
}

main();