import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { insertEventSchema, insertSiteSettingsSchema } from "@shared/schema";
import { z } from "zod";
import {insertUserSchema} from "@shared/schema" // Assuming this schema exists
import { log } from "./vite";


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

  // Site settings routes
  app.get("/api/admin/site-settings", requireAdmin, async (req, res) => {
    const settings = await global.appStorage.getSiteSettings();
    res.json(settings);
  });

  app.put("/api/admin/site-settings", requireAdmin, async (req, res) => {
    try {
      log(`Received site settings update request: ${JSON.stringify(req.body, (key, value) => {
        // Hide long string content in logs
        if (typeof value === 'string' && value.length > 50) {
          return value.substring(0, 47) + '...';
        }
        return value;
      })}`, 'routes');
      
      const result = insertSiteSettingsSchema.partial().safeParse(req.body);
      if (!result.success) {
        log(`Invalid settings data: ${JSON.stringify(result.error.issues)}`, 'routes');
        return res.status(400).json({ message: "Invalid settings data", errors: result.error.issues });
      }
      
      // Process the settings data
      const settingsData = { ...result.data };
      
      // Check if logoUrl is a blob URL or data URL
      if (settingsData.logoUrl) {
        log(`Processing logoUrl of type: ${typeof settingsData.logoUrl}`, 'routes');
        
        if (typeof settingsData.logoUrl === 'object' && Array.isArray(settingsData.logoUrl)) {
          // Handle case where logoUrl is an array (from the image upload component)
          if (settingsData.logoUrl.length > 0) {
            settingsData.logoUrl = settingsData.logoUrl[0];
            log(`Converted logoUrl from array to string, new length: ${settingsData.logoUrl.length}`, 'routes');
          } else {
            settingsData.logoUrl = '/assets/logo.jpeg';
            log(`Empty array received for logoUrl, using default`, 'routes');
          }
        }
        
        if (typeof settingsData.logoUrl === 'string') {
          if (settingsData.logoUrl.startsWith('blob:')) {
            // For blob URLs, we'll use the default logo
            settingsData.logoUrl = '/assets/logo.jpeg';
            log(`Changed blob URL to default logo path: ${settingsData.logoUrl}`, 'routes');
          } else if (settingsData.logoUrl.startsWith('data:image/')) {
            // This is a base64 encoded image that we can store directly
            log(`Saving base64 image data (length: ${settingsData.logoUrl.length})`, 'routes');
            // Keep as is, the base64 data will be stored in the database
          } else {
            log(`Using existing logo URL: ${settingsData.logoUrl}`, 'routes');
          }
        }
      }
      
      const settings = await global.appStorage.updateSiteSettings(settingsData);
      log(`Site settings updated successfully`, 'routes');
      res.json(settings);
    } catch (error) {
      log(`Error updating site settings: ${error}`, 'routes');
      console.error('Full error:', error);
      res.status(500).json({ message: `Error updating site settings: ${error.message}` });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await global.appStorage.getAllUsers();
    // Return all users including pending (unapproved) users
    res.json(users);
  });

  app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const user = await global.appStorage.updateUser(parseInt(id), { isApproved: true });
    res.json(user);
  });

  app.post("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await global.appStorage.updateUser(parseInt(id), { role });
    res.json(user);
  });
  
  // Kullanıcı aktif/pasif durum değiştirme rotası
  app.post("/api/admin/users/:id/toggle-active", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      
      // Mevcut kullanıcıyı al
      const user = await global.appStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }
      
      // Aktiflik durumunu tersine çevir
      const newStatus = !user.isActive;
      const updatedUser = await global.appStorage.updateUser(userId, { isActive: newStatus });
      
      log(`Kullanıcı ${userId} aktiflik durumu ${newStatus ? 'aktif' : 'pasif'} olarak güncellendi`, 'routes');
      res.json(updatedUser);
    } catch (error) {
      log(`Kullanıcı aktiflik durumu güncellenirken hata: ${error}`, 'routes');
      res.status(500).json({ message: `Kullanıcı durumu güncellenirken hata oluştu: ${error.message}` });
    }
  });

  // Admin participant approval route
  app.post("/api/admin/events/:eventId/participants/:participantId/approve", requireAdmin, async (req, res) => {
    const { eventId, participantId } = req.params;
    const participant = await global.appStorage.updateEventParticipant(parseInt(participantId), {
      isApproved: true
    });
    res.json(participant);
  });

  //New Route for payment update
  app.put("/api/admin/events/:eventId/participants/:participantId/payment", requireAdmin, async (req, res) => {
    const { eventId, participantId } = req.params;
    const { status } = req.body;

    if (!["pending", "paid"].includes(status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const participant = await global.appStorage.updateEventParticipant(parseInt(participantId), {
      paymentStatus: status
    });
    res.json(participant);
  });


  // Event routes
  app.get("/api/events", requireAuth, async (req, res) => {
    const events = await global.appStorage.getAllEvents();
    res.json(events);
  });

  app.get("/api/events/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const event = await global.appStorage.getEvent(parseInt(id));
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    const result = insertEventSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid event data" });
    }
    const event = await global.appStorage.createEvent({
      ...result.data,
      createdById: req.user!.id,
    });
    res.status(201).json(event);
  });

  app.put("/api/events/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const result = insertEventSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid event data" });
    }
    const event = await global.appStorage.updateEvent(parseInt(id), result.data);
    res.json(event);
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    await global.appStorage.deleteEvent(parseInt(id));
    res.sendStatus(204);
  });

  // Event participation routes
  app.get("/api/events/:id/my-participation", requireAuth, async (req, res) => {
    const { id } = req.params;
    const participation = await global.appStorage.getUserEventParticipation(req.user!.id, parseInt(id));
    res.json(participation);
  });

  app.post("/api/events/:id/participate", requireAuth, async (req, res) => {
    const { id } = req.params;
    const result = z.object({
      status: z.enum(["attending", "declined"]),
      roomType: z.enum(["single", "double", "triple", "quad"]).optional(),
      roomOccupancy: z.number().min(1).max(4).optional(),
      paymentStatus: z.enum(["pending", "paid"]).optional()
    }).safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ message: "Invalid participation data" });
    }

    // Check if user already has a participation request
    const existingParticipation = await global.appStorage.getUserEventParticipation(req.user!.id, parseInt(id));
    if (existingParticipation) {
      return res.status(400).json({ message: "Katılım talebiniz zaten bulunmakta" });
    }

    const participant = await global.appStorage.addEventParticipant({
      eventId: parseInt(id),
      userId: req.user!.id,
      ...result.data,
      isApproved: false
    });
    res.status(201).json(participant);
  });

  app.put("/api/events/:id/participate", requireAuth, async (req, res) => {
    const { id } = req.params;
    const result = z.object({
      roomType: z.enum(["single", "double", "triple", "quad"]),
      roomOccupancy: z.number().min(1).max(4)
    }).safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ message: "Invalid update data" });
    }

    const existingParticipation = await global.appStorage.getUserEventParticipation(req.user!.id, parseInt(id));
    if (!existingParticipation) {
      return res.status(404).json({ message: "Katılım bulunamadı" });
    }

    // Save old approved values
    const oldValues = {
      roomType: existingParticipation.roomType,
      roomOccupancy: existingParticipation.roomOccupancy,
      isApproved: existingParticipation.isApproved
    };

    // Update with new values, set isApproved to false
    const participant = await global.appStorage.updateEventParticipant(existingParticipation.id, {
      ...result.data,
      isApproved: false,
      oldValues: oldValues // Save old values for potential rollback
    });

    res.json(participant);
  });

  // Admin routes for handling participation updates
  app.post("/api/admin/events/:eventId/participants/:participantId/approve", requireAdmin, async (req, res) => {
    const { participantId } = req.params;
    const participant = await global.appStorage.updateEventParticipant(parseInt(participantId), {
      isApproved: true,
      oldValues: null // Clear old values on approval
    });
    res.json(participant);
  });

  app.post("/api/admin/events/:eventId/participants/:participantId/reject", requireAdmin, async (req, res) => {
    const { participantId } = req.params;
    const participant = await global.appStorage.getEventParticipant(parseInt(participantId));

    if (!participant || !participant.oldValues) {
      return res.status(404).json({ message: "Katılım veya eski değerler bulunamadı" });
    }

    // Restore old values
    const updatedParticipant = await global.appStorage.updateEventParticipant(parseInt(participantId), {
      roomType: participant.oldValues.roomType,
      roomOccupancy: participant.oldValues.roomOccupancy,
      isApproved: participant.oldValues.isApproved,
      oldValues: null
    });

    res.json(updatedParticipant);
  });

  app.get("/api/events/:id/participants", requireAuth, async (req, res) => {
    const { id } = req.params;
    const participants = await global.appStorage.getEventParticipants(parseInt(id));

    if (req.user!.role === "admin") {
      // For admin, include user details
      const participantsWithDetails = await Promise.all(
        participants.map(async (p) => {
          const user = await global.appStorage.getUser(p.userId);
          return {
            id: p.id,
            eventId: p.eventId,
            userId: p.userId,
            status: p.status,
            isApproved: p.isApproved,
            roomType: p.roomType,
            roomOccupancy: p.roomOccupancy,
            paymentStatus: p.paymentStatus || "pending",
            user: user ? {
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              email: user.email
            } : null
          };
        })
      );
      res.json(participantsWithDetails);
    } else {
      // For regular users, only show approved participants
      const approvedParticipants = participants.filter(p => p.isApproved);
      res.json(approvedParticipants);
    }
  });

  // User participation history
  app.get("/api/user/participations", requireAuth, async (req, res) => {
    const participants = await global.appStorage.getUserParticipations(req.user!.id);
    const participationsWithEvents = await Promise.all(
      participants.map(async (p) => {
        const event = await global.appStorage.getEvent(p.eventId);
        return { ...p, event };
      })
    );
    res.json(participationsWithEvents);
  });

  // Profil güncelleme route'u
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const result = insertUserSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.issues });
      }

      // Instagram artık doğrudan API kullanımını engellediği için avatarUrl'i güncellemiyoruz
      // Sadece kullanıcı tarafından sağlanan diğer bilgileri güncelliyoruz
      
      log(`Profil güncellemesi: Kullanıcı ID ${req.user!.id}`, 'routes');
      
      const updatedUser = await global.appStorage.updateUser(req.user!.id, {
        ...result.data
      });

      log(`Profil başarıyla güncellendi: ${JSON.stringify(updatedUser, (key, value) => {
        if (key === 'password') return '[GİZLİ]';
        return value;
      })}`, 'routes');
      
      res.json(updatedUser);
    } catch (error) {
      log(`Profil güncellemesi sırasında hata: ${error}`, 'routes');
      res.status(500).json({ message: "Profil güncellenirken hata oluştu", error: error.message });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}