import { User, Event, EventParticipant, SiteSettings, InsertUser, InsertEvent, InsertEventParticipant, InsertSiteSettings } from "../shared/schema";
import session from "express-session";

// Storage interface for database operations
export interface IStorage {
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Event methods
  createEvent(event: InsertEvent & { createdById: number }): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  
  // Event participant methods
  addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant>;
  getEventParticipants(eventId: number): Promise<EventParticipant[]>;
  updateEventParticipant(id: number, updates: Partial<EventParticipant>): Promise<EventParticipant>;
  getUserParticipations(userId: number): Promise<EventParticipant[]>;
  getUserEventParticipation(userId: number, eventId: number): Promise<EventParticipant | undefined>;
  
  // Site settings methods
  getSiteSettings(): Promise<SiteSettings | null>;
  updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings>;
}