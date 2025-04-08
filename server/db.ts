import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import ws from 'ws';

// Set up WebSocket for Neon Serverless
if (!globalThis.WebSocket) {
  (globalThis as any).WebSocket = ws;
}

// Initialize the connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable not set');
}

// Use the recommended method for Neon Serverless
const sql = neon(connectionString);
const pool = new Pool({ connectionString });

// Create the Drizzle client
export const db = drizzle(pool, { schema });