
import path from "path";
import fs from "fs/promises";
import { IStorage } from "./types";
import { User, Event, EventParticipant, SiteSettings, InsertUser, InsertEvent, InsertEventParticipant, InsertSiteSettings } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { scrypt, randomBytes, createHash } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashDevPassword(password: string) {
  const salt = "devsalt";
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export class FileStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private eventParticipants: Map<number, EventParticipant>;
  private siteSettings: SiteSettings | null;
  sessionStore: session.Store;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.eventParticipants = new Map();
    this.siteSettings = null;
    this.currentId = { users: 3, events: 1, eventParticipants: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.initDevUsers();
    this.initTestEvents();
    this.initDefaultSettings();
  }

  private async initDevUsers() {
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
      isApproved: true,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(adminUser.id, adminUser);

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
      isApproved: true,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(testUser.id, testUser);
  }

  private async initTestEvents() {
    const testEvent: Event = {
      id: 1,
      title: "15-19 Nisan 2025 Kars Sarıkamış",
      description: "Kars Sarıkamış'ta muhteşem bir snowboard deneyimi",
      content: `<h2>Etkinlik Detayları</h2>
<p>15-19 Nisan 2025 tarihleri arasında Kars Sarıkamış'ta düzenlenecek olan snowboard etkinliğimize davetlisiniz!</p>
<h3>Program</h3>
<ul>
<li>15 Nisan: Karşılama ve otele yerleşme</li>
<li>16-18 Nisan: Snowboard aktiviteleri</li>
<li>19 Nisan: Kapanış ve dönüş</li>
</ul>
<h3>Konaklama</h3>
<p>Katılımcılar için farklı oda seçenekleri mevcuttur:</p>
<ul>
<li>Tek kişilik odalar</li>
<li>İki kişilik odalar</li>
<li>Üç kişilik odalar</li>
<li>Dört kişilik odalar</li>
</ul>`,
      date: new Date("2025-04-15"),
      endDate: new Date("2025-04-19"),
      location: "Kars, Sarıkamış",
      images: ["/assets/test-image.jpg"],
      createdById: 1
    };
    this.events.set(testEvent.id, testEvent);
  }

  private async initDefaultSettings() {
    if (!this.siteSettings) {
      this.siteSettings = {
        id: 1,
        logoUrl: "/assets/logo.jpg",
        primaryColor: "#914199",
        secondaryColor: "#F7E15C",
        updatedAt: new Date(),
      };
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    // Local file storage implementation
    const publicDir = path.join(process.cwd(), "public");
    const assetsDir = path.join(publicDir, "assets");
    
    try {
      await fs.mkdir(assetsDir, { recursive: true });
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(assetsDir, fileName);
      await fs.writeFile(filePath, file.buffer);
      return `/assets/${fileName}`;
    } catch (error) {
      console.error("Error saving file:", error);
      throw error;
    }
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
      avatarUrl: null,
      resetToken: null,
      resetTokenExpiry: null
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token && user.resetTokenExpiry && new Date(user.resetTokenExpiry) > new Date(),
    );
  }

  // Event methods
  async createEvent(event: InsertEvent & { createdById: number }): Promise<Event> {
    const id = this.currentId.events++;
    const newEvent: Event = { 
      ...event, 
      id,
      date: new Date(event.date),
      endDate: new Date(event.endDate),
      images: event.images || []
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
    const newParticipant: EventParticipant = { 
      ...participant, 
      id,
      roomType: participant.roomType || null,
      roomOccupancy: participant.roomOccupancy || null,
      paymentStatus: participant.paymentStatus || "pending",
      isApproved: false
    };
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

  async getUserParticipations(userId: number): Promise<EventParticipant[]> {
    return Array.from(this.eventParticipants.values())
      .filter(p => p.userId === userId);
  }

  async getUserEventParticipation(userId: number, eventId: number): Promise<EventParticipant | undefined> {
    return Array.from(this.eventParticipants.values())
      .find(p => p.userId === userId && p.eventId === eventId);
  }

  // Site settings methods
  async getSiteSettings(): Promise<SiteSettings | null> {
    return this.siteSettings;
  }

  async updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    this.siteSettings = {
      ...this.siteSettings!,
      ...settings,
      updatedAt: new Date(),
    };
    return this.siteSettings;
  }
}

export const storage = new FileStorage();
