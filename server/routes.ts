import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEventSchema, insertEventParticipantSchema } from "@shared/schema";
import { z } from "zod";

function requireAuth(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const user = await storage.updateUser(parseInt(id), { isApproved: true });
    res.json(user);
  });

  app.post("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await storage.updateUser(parseInt(id), { role });
    res.json(user);
  });

  // Event routes
  app.get("/api/events", requireAuth, async (req, res) => {
    const events = await storage.getAllEvents();
    res.json(events);
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    const result = insertEventSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid event data" });
    }
    const event = await storage.createEvent({
      ...result.data,
      createdById: req.user.id,
    });
    res.status(201).json(event);
  });

  app.put("/api/events/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const result = insertEventSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid event data" });
    }
    const event = await storage.updateEvent(parseInt(id), result.data);
    res.json(event);
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    await storage.deleteEvent(parseInt(id));
    res.sendStatus(204);
  });

  // Event participation routes
  app.post("/api/events/:id/participate", requireAuth, async (req, res) => {
    const { id } = req.params;
    const result = z.object({ status: z.enum(["attending", "maybe", "declined"]) }).safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const participant = await storage.addEventParticipant({
      eventId: parseInt(id),
      userId: req.user.id,
      status: result.data.status,
    });
    res.status(201).json(participant);
  });

  app.get("/api/events/:id/participants", requireAuth, async (req, res) => {
    const { id } = req.params;
    const participants = await storage.getEventParticipants(parseInt(id));
    res.json(participants);
  });

  const httpServer = createServer(app);
  return httpServer;
}
