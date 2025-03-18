import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table with extended profile fields
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
  content: json("content").notNull(),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  createdById: integer("created_by_id").notNull(),
});

// Event participants table güncelleniyor
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull(), // attending, maybe, declined
  isApproved: boolean("is_approved").notNull().default(false), // Admin onayı
  roomPreference: integer("room_preference"), // 1-4 kişilik oda tercihi
  paymentStatus: text("payment_status").default("pending"), // pending, paid
});

// Schemas
export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
}).omit({ id: true, role: true, isApproved: true });

export const insertEventSchema = createInsertSchema(events).extend({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Geçerli bir başlangıç tarihi giriniz"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Geçerli bir bitiş tarihi giriniz"),
}).omit({
  id: true,
  createdById: true
});

// Event participant tipi güncelleniyor
export const insertEventParticipantSchema = createInsertSchema(eventParticipants)
  .extend({
    status: z.enum(["attending", "maybe", "declined"]),
    roomPreference: z.number().min(1).max(4).optional(),
    paymentStatus: z.enum(["pending", "paid"]).optional()
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