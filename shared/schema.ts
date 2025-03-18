import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Site settings table
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  occupation: text("occupation").notNull(),
  instagram: text("instagram"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("user"),
  isApproved: boolean("is_approved").notNull().default(false),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location").notNull(),
  images: json("images").$type<string[]>().default([]).notNull(),
  createdById: integer("created_by_id").notNull(),
});

// Event participants table
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  roomType: text("room_type"),
  roomOccupancy: integer("room_occupancy"),
  paymentStatus: text("payment_status").default("pending"),
  oldValues: json("old_values").$type<{
    roomType: string | null,
    roomOccupancy: number | null,
    isApproved: boolean
  } | null>().default(null)
});

// Site settings schema
export const insertSiteSettingsSchema = createInsertSchema(siteSettings)
  .extend({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Geçerli bir HEX renk kodu giriniz"),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Geçerli bir HEX renk kodu giriniz"),
  })
  .omit({ id: true, updatedAt: true });

// Schemas
export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
}).omit({ id: true, role: true, isApproved: true });

export const insertEventSchema = createInsertSchema(events).extend({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Geçerli bir başlangıç tarihi giriniz"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Geçerli bir bitiş tarihi giriniz"),
  content: z.string(),
  images: z.array(z.string()).default([]),
}).omit({
  id: true,
  createdById: true
});

// Event participant schema'yı güncelliyorum
export const insertEventParticipantSchema = createInsertSchema(eventParticipants)
  .extend({
    status: z.enum(["attending", "declined"]),
    roomType: z.enum(["single", "double", "triple", "quad"]).optional(),
    roomOccupancy: z.number().min(1).max(4).optional(),
    paymentStatus: z.enum(["pending", "paid"]).optional(),
    oldValues: z.object({
      roomType: z.string().nullable(),
      roomOccupancy: z.number().nullable(),
      isApproved: z.boolean()
    }).nullable().default(null)
  })
  .omit({
    id: true,
    isApproved: true
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;