import { IStorage } from './storage';
import { Event, EventParticipant, InsertEvent, InsertEventParticipant, InsertSiteSettings, InsertUser, SiteSettings, User } from '../shared/schema';
import { db } from './db';
import { and, eq } from 'drizzle-orm';
import { events, eventParticipants, siteSettings, users } from '../shared/schema';
import { log } from './vite';
import session from 'express-session';
import pgSession from 'connect-pg-simple';

export class PostgresStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Set up PostgreSQL session store
    const PostgresqlStore = pgSession(session);
    this.sessionStore = new PostgresqlStore({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true
    });
    log('PostgreSQL storage initialized', 'pg-storage');
  }

  async getUser(id: number): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id)
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username)
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.query.users.findMany();
  }

  async createEvent(event: InsertEvent & { createdById: number }): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, id)
    });
  }

  async getAllEvents(): Promise<Event[]> {
    return db.query.events.findMany();
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    const result = await db.update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant> {
    const result = await db.insert(eventParticipants).values(participant).returning();
    return result[0];
  }

  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    return db.query.eventParticipants.findMany({
      where: (eventParticipants, { eq }) => eq(eventParticipants.eventId, eventId)
    });
  }

  async updateEventParticipant(id: number, updates: Partial<EventParticipant>): Promise<EventParticipant> {
    const result = await db.update(eventParticipants)
      .set(updates)
      .where(eq(eventParticipants.id, id))
      .returning();
    return result[0];
  }

  async getUserParticipations(userId: number): Promise<EventParticipant[]> {
    return db.query.eventParticipants.findMany({
      where: (eventParticipants, { eq }) => eq(eventParticipants.userId, userId),
      with: {
        event: true
      }
    });
  }

  async getUserEventParticipation(userId: number, eventId: number): Promise<EventParticipant | undefined> {
    return db.query.eventParticipants.findFirst({
      where: (ep, { eq, and }) => and(
        eq(ep.userId, userId),
        eq(ep.eventId, eventId)
      )
    });
  }

  async getSiteSettings(): Promise<SiteSettings | null> {
    const settings = await db.query.siteSettings.findFirst();
    return settings || null;
  }

  async updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings> {
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
      const result = await db.insert(siteSettings).values(settings).returning();
      return result[0];
    }
  }
}