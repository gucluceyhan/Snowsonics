import { log } from './vite';
import { MemStorage, storage } from './storage';
import { PostgresStorage } from './pg-storage';
import { initializeDb } from './db';
import { IStorage } from './types';

export async function initializeStorage(): Promise<IStorage> {
  // Try to initialize PostgreSQL storage first
  try {
    log('Initializing PostgreSQL storage', 'db-init');
    
    // Test database connection
    await initializeDb();
    
    // If successful, create and return PostgresStorage
    const pgStorage = new PostgresStorage();
    log('PostgreSQL storage initialized successfully', 'db-init');
    return pgStorage;
  } catch (error) {
    log(`Failed to initialize PostgreSQL storage: ${error}`, 'db-init');
    log('Falling back to in-memory storage', 'db-init');
    
    // Return the in-memory storage as fallback
    return storage;
  }
}