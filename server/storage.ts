import { IStorage } from "./types";
import { User, Event, EventParticipant, InsertUser, InsertEvent, InsertEventParticipant } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashDevPassword(password: string) {
  const salt = "devsalt";
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private eventParticipants: Map<number, EventParticipant>;
  sessionStore: session.Store;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.eventParticipants = new Map();
    this.currentId = { users: 3, events: 1, eventParticipants: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Geliştirme için varsayılan kullanıcıları oluştur
    this.initDevUsers();
  }

  private async initDevUsers() {
    // Admin kullanıcısı
    const adminUser: User = {
      id: 1,
      username: "admin",
      password: await hashDevPassword("admin123"),
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      phone: "5551234567",
      city: "Istanbul",
      occupation: "Administrator",
      instagram: null,
      avatarUrl: null,
      role: "admin",
      isApproved: true
    };
    this.users.set(adminUser.id, adminUser);

    // Test kullanıcısı
    const testUser: User = {
      id: 2,
      username: "testuser",
      password: await hashDevPassword("test123"),
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "5559876543",
      city: "Ankara",
      occupation: "Test User",
      instagram: null,
      avatarUrl: null,
      role: "user",
      isApproved: true
    };
    this.users.set(testUser.id, testUser);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const isFirstUser = (await this.getAllUsers()).length === 0;
    const user: User = { 
      ...insertUser, 
      id, 
      role: isFirstUser ? "admin" : "user", 
      isApproved: isFirstUser,
      instagram: insertUser.instagram || null,
      avatarUrl: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Event methods
  async createEvent(event: InsertEvent & { createdById: number }): Promise<Event> {
    const id = this.currentId.events++;
    const newEvent: Event = { 
      ...event, 
      id,
      imageUrl: event.imageUrl || null
    };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    const event = await this.getEvent(id);
    if (!event) throw new Error("Event not found");
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    this.events.delete(id);
  }

  // Event participant methods
  async addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant> {
    const id = this.currentId.eventParticipants++;
    const newParticipant: EventParticipant = { ...participant, id };
    this.eventParticipants.set(id, newParticipant);
    return newParticipant;
  }

  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    return Array.from(this.eventParticipants.values())
      .filter(p => p.eventId === eventId);
  }

  async updateEventParticipant(id: number, updates: Partial<EventParticipant>): Promise<EventParticipant> {
    const participant = this.eventParticipants.get(id);
    if (!participant) throw new Error("Participant not found");
    const updatedParticipant = { ...participant, ...updates };
    this.eventParticipants.set(id, updatedParticipant);
    return updatedParticipant;
  }
}

export const storage = new MemStorage();