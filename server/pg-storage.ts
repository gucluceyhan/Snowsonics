import { IStorage } from './types';
import { Event, EventParticipant, InsertEvent, InsertEventParticipant, InsertSiteSettings, InsertUser, SiteSettings, User } from '../shared/schema';
import { db } from './db';
import { and, eq } from 'drizzle-orm';
import { events, eventParticipants, siteSettings, users } from '../shared/schema';
import { log } from './vite';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import pg from 'pg';

export class PostgresStorage implements IStorage {
  sessionStore: session.Store;
  private pool: pg.Pool;

  constructor() {
    // Create a connection pool for the session store
    this.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Neon DB
      }
    });
    
    // Set up PostgreSQL session store
    const PostgresqlStore = pgSession(session);
    this.sessionStore = new PostgresqlStore({
      pool: this.pool,
      tableName: 'session',
      createTableIfMissing: true,
      ttl: 86400, // 24 saat (saniye cinsinden)
      pruneSessionInterval: 60 // Her dakika eski oturumları temizle
    });
    
    log('PostgreSQL storage initialized', 'pg-storage');
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      log(`Error getting user: ${error}`, 'pg-storage');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      log(`Error getting user by username: ${error}`, 'pg-storage');
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      log(`Error creating user: ${error}`, 'pg-storage');
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      const result = await db.update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating user: ${error}`, 'pg-storage');
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      log(`Error getting all users: ${error}`, 'pg-storage');
      return [];
    }
  }

  async createEvent(event: InsertEvent & { createdById: number }): Promise<Event> {
    try {
      // Process date fields
      const processedEvent = { ...event };
      
      // Handle date conversion
      if (typeof event.date === 'string') {
        log(`Converting date string to Date object: ${event.date}`, 'pg-storage');
        processedEvent.date = new Date(event.date);
      }
      
      // Handle endDate conversion
      if (typeof event.endDate === 'string') {
        log(`Converting endDate string to Date object: ${event.endDate}`, 'pg-storage');
        processedEvent.endDate = new Date(event.endDate);
      }
      
      log(`Creating event with processed data: ${JSON.stringify(processedEvent)}`, 'pg-storage');
      
      // Need to cast as array to fix type issue with drizzle-orm
      const result = await db.insert(events).values([processedEvent as any]).returning();
      log(`Event created successfully: ${JSON.stringify(result[0])}`, 'pg-storage');
      return result[0];
    } catch (error) {
      log(`Error creating event: ${error}`, 'pg-storage');
      console.error('Full error:', error);
      throw error;
    }
  }

  async getEvent(id: number): Promise<Event | undefined> {
    try {
      const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
      return result[0];
    } catch (error) {
      log(`Error getting event: ${error}`, 'pg-storage');
      return undefined;
    }
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      return await db.select().from(events);
    } catch (error) {
      log(`Error getting all events: ${error}`, 'pg-storage');
      return [];
    }
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    try {
      // Process date fields if they exist and are strings
      const processedUpdates = { ...updates };
      
      // Enhanced date handling with logging
      if (updates.date) {
        if (typeof updates.date === 'string') {
          log(`Converting date string to Date object: ${updates.date}`, 'pg-storage');
          processedUpdates.date = new Date(updates.date);
        } else if (updates.date instanceof Date) {
          log(`Using existing Date object for date`, 'pg-storage');
          processedUpdates.date = updates.date;
        } else {
          log(`Unknown date format, using as is: ${typeof updates.date}`, 'pg-storage');
        }
      }
      
      if (updates.endDate) {
        if (typeof updates.endDate === 'string') {
          log(`Converting endDate string to Date object: ${updates.endDate}`, 'pg-storage');
          processedUpdates.endDate = new Date(updates.endDate);
        } else if (updates.endDate instanceof Date) {
          log(`Using existing Date object for endDate`, 'pg-storage');
          processedUpdates.endDate = updates.endDate;
        } else {
          log(`Unknown endDate format, using as is: ${typeof updates.endDate}`, 'pg-storage');
        }
      }
      
      // Log the processed updates before database operation
      log(`Updating event ${id} with processed data: ${JSON.stringify(processedUpdates)}`, 'pg-storage');
      
      const result = await db.update(events)
        .set(processedUpdates)
        .where(eq(events.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`Event with ID ${id} not found`);
      }
      
      log(`Event updated successfully: ${JSON.stringify(result[0])}`, 'pg-storage');
      return result[0];
    } catch (error) {
      log(`Error updating event: ${error}`, 'pg-storage');
      console.error('Full error:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<void> {
    try {
      await db.delete(events).where(eq(events.id, id));
    } catch (error) {
      log(`Error deleting event: ${error}`, 'pg-storage');
      throw error;
    }
  }

  async addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant> {
    try {
      const result = await db.insert(eventParticipants).values([participant as any]).returning();
      return result[0];
    } catch (error) {
      log(`Error adding event participant: ${error}`, 'pg-storage');
      throw error;
    }
  }

  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    try {
      return await db.select()
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId));
    } catch (error) {
      log(`Error getting event participants: ${error}`, 'pg-storage');
      return [];
    }
  }

  async updateEventParticipant(id: number, updates: Partial<EventParticipant>): Promise<EventParticipant> {
    try {
      const result = await db.update(eventParticipants)
        .set(updates)
        .where(eq(eventParticipants.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating event participant: ${error}`, 'pg-storage');
      throw error;
    }
  }

  async getUserParticipations(userId: number): Promise<EventParticipant[]> {
    try {
      // Query event participants by user ID
      const participations = await db.select()
        .from(eventParticipants)
        .where(eq(eventParticipants.userId, userId));
      
      // For each participation, fetch the associated event details
      // This is a bit inefficient but should work until we implement proper relations
      const participationsWithEvents: any[] = [];
      for (const p of participations) {
        const event = await this.getEvent(p.eventId);
        if (event) {
          participationsWithEvents.push({
            ...p,
            event
          });
        }
      }
      
      return participationsWithEvents;
    } catch (error) {
      log(`Error getting user participations: ${error}`, 'pg-storage');
      return [];
    }
  }

  async getUserEventParticipation(userId: number, eventId: number): Promise<EventParticipant | undefined> {
    try {
      const result = await db.select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.userId, userId),
          eq(eventParticipants.eventId, eventId)
        ))
        .limit(1);
      return result[0];
    } catch (error) {
      log(`Error getting user event participation: ${error}`, 'pg-storage');
      return undefined;
    }
  }

  async getSiteSettings(): Promise<SiteSettings | null> {
    try {
      const result = await db.select().from(siteSettings).limit(1);
      return result[0] || null;
    } catch (error) {
      log(`Error getting site settings: ${error}`, 'pg-storage');
      return null;
    }
  }

  async updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    try {
      // Get the current settings first
      const currentSettings = await this.getSiteSettings();
      
      if (currentSettings) {
        // Update existing settings
        const result = await db.update(siteSettings)
          .set(settings)
          .where(eq(siteSettings.id, currentSettings.id))
          .returning();
        return result[0];
      } else {
        // Create new settings if none exist
        const result = await db.insert(siteSettings).values([settings as any]).returning();
        return result[0];
      }
    } catch (error) {
      log(`Error updating site settings: ${error}`, 'pg-storage');
      throw error;
    }
  }
}