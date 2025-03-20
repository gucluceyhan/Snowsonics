import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema';
import { log } from './vite';

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This is necessary for connecting to Neon DB
  }
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Test database connection
export async function initializeDb() {
  try {
    log('Initializing PostgreSQL database connection...', 'pg-db');
    
    // Test connection by querying database
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT 1 as test');
      if (result.rows[0].test === 1) {
        log('PostgreSQL connection test successful', 'pg-db');
        return true;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    log(`PostgreSQL database initialization failed: ${error}`, 'pg-db');
    throw error;
  }
}