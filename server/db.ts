import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { log } from './vite';

// Create a PostgreSQL client
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

// Client for query processing
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Create a migration function to set up the database schema
export async function migrate() {
  try {
    log('Running database migrations', 'db');
    
    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "site_settings" (
        "id" SERIAL PRIMARY KEY,
        "logoUrl" TEXT,
        "primaryColor" TEXT NOT NULL DEFAULT '#4F45E4',
        "eventCardColor" TEXT,
        "siteName" TEXT,
        "welcomeMessage" TEXT
      );
      
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "firstName" TEXT,
        "lastName" TEXT,
        "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
        "email" TEXT,
        "phone" TEXT,
        "instagram" TEXT,
        "twitter" TEXT,
        "avatarUrl" TEXT
      );
      
      CREATE TABLE IF NOT EXISTS "events" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE,
        "location" TEXT,
        "imageUrls" TEXT[],
        "createdById" INTEGER NOT NULL,
        "capacity" INTEGER,
        CONSTRAINT "events_createdById_users_id_fk" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS "event_participants" (
        "id" SERIAL PRIMARY KEY,
        "eventId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "status" TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "event_participants_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE,
        CONSTRAINT "event_participants_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "event_participants_eventId_userId_unique" UNIQUE ("eventId", "userId")
      );
    `);
    
    // Check if the admin user already exists
    const adminExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'admin')
    });
    
    if (!adminExists) {
      // Insert a default admin user
      await db.insert(schema.users).values({
        username: 'admin',
        password: 'd9b0636fc082c9db1a63dac05e129eb7cfd968c3de1611d1a5b9e9bccba92d1f', // 'admin123' - Only for development
        isAdmin: true
      });
      log('Created default admin user', 'db');
    }
    
    // Check if site settings exist
    const settingsExist = await db.query.siteSettings.findFirst();
    
    if (!settingsExist) {
      // Insert default site settings
      await db.insert(schema.siteSettings).values({
        logoUrl: '/assets/new_whatsons_logo.png',
        primaryColor: '#4F45E4',
        siteName: 'Event Manager',
        welcomeMessage: 'Welcome to the Event Manager platform!'
      });
      log('Created default site settings', 'db');
    }
    
    // Create a test event if none exist
    const eventsExist = await db.query.events.findFirst();
    
    if (!eventsExist) {
      const admin = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, 'admin')
      });
      
      if (admin) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        
        await db.insert(schema.events).values({
          title: '15-19 Nisan 2025 Kars Sarıkamış Turu',
          description: 'Katılımcıların kendilerini zorlayacakları, doğa ile iç içe olacakları, günlük şehir hayatından uzaklaşarak kendilerini keşfedebilecekleri ve unutulmaz anılar biriktirebilecekleri bir macera!',
          date: new Date(),
          endDate: futureDate,
          location: 'Kars, Türkiye',
          imageUrls: ['/assets/kars-event.jpg'],
          createdById: admin.id,
          capacity: 20
        });
        log('Created sample event', 'db');
      }
    }
    
    log('Database migrations completed successfully', 'db');
  } catch (error) {
    console.error('Error during database migrations:', error);
    throw error;
  }
}