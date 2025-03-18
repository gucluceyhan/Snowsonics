import { IStorage } from "./types";
import { User, Event, EventParticipant, InsertUser, InsertEvent, InsertEventParticipant } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

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
    this.currentId = { users: 1, events: 1, eventParticipants: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
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
    const user: User = { ...insertUser, id, role: "admin", isApproved: true };
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
    const newEvent: Event = { ...event, id };
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
