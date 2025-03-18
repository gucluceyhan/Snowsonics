import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEventSchema, insertSiteSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import axios from "axios";
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `logo-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Site settings routes
  app.get("/api/admin/site-settings", requireAdmin, async (req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  app.put("/api/admin/site-settings", requireAdmin, upload.single('logo'), async (req, res) => {
    try {
      const updateData = {
        primaryColor: req.body.primaryColor,
        secondaryColor: req.body.secondaryColor,
      };

      if (req.file) {
        const logoUrl = `/uploads/${req.file.filename}`;
        updateData.logoUrl = logoUrl;
      }

      const settings = await storage.updateSiteSettings(updateData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ 
        message: error.message || "Site ayarları güncellenirken bir hata oluştu" 
      });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    const approvedUsers = users.filter(user => user.isApproved);
    res.json(approvedUsers);
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

  // Admin participant approval route
  app.post("/api/admin/events/:eventId/participants/:participantId/approve", requireAdmin, async (req, res) => {
    const { eventId, participantId } = req.params;
    const participant = await storage.updateEventParticipant(parseInt(participantId), {
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

    const participant = await storage.updateEventParticipant(parseInt(participantId), {
      paymentStatus: status
    });
    res.json(participant);
  });


  // Event routes
  app.get("/api/events", requireAuth, async (req, res) => {
    const events = await storage.getAllEvents();
    res.json(events);
  });

  app.get("/api/events/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const event = await storage.getEvent(parseInt(id));
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
  app.get("/api/events/:id/my-participation", requireAuth, async (req, res) => {
    const { id } = req.params;
    const participation = await storage.getUserEventParticipation(req.user!.id, parseInt(id));
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
    const existingParticipation = await storage.getUserEventParticipation(req.user!.id, parseInt(id));
    if (existingParticipation) {
      return res.status(400).json({ message: "Katılım talebiniz zaten bulunmakta" });
    }

    const participant = await storage.addEventParticipant({
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

    const existingParticipation = await storage.getUserEventParticipation(req.user!.id, parseInt(id));
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
    const participant = await storage.updateEventParticipant(existingParticipation.id, {
      ...result.data,
      isApproved: false,
      oldValues: oldValues // Save old values for potential rollback
    });

    res.json(participant);
  });

  // Admin routes for handling participation updates
  app.post("/api/admin/events/:eventId/participants/:participantId/approve", requireAdmin, async (req, res) => {
    const { participantId } = req.params;
    const participant = await storage.updateEventParticipant(parseInt(participantId), {
      isApproved: true,
      oldValues: null // Clear old values on approval
    });
    res.json(participant);
  });

  app.post("/api/admin/events/:eventId/participants/:participantId/reject", requireAdmin, async (req, res) => {
    const { participantId } = req.params;
    const participant = await storage.getEventParticipant(parseInt(participantId));

    if (!participant || !participant.oldValues) {
      return res.status(404).json({ message: "Katılım veya eski değerler bulunamadı" });
    }

    // Restore old values
    const updatedParticipant = await storage.updateEventParticipant(parseInt(participantId), {
      roomType: participant.oldValues.roomType,
      roomOccupancy: participant.oldValues.roomOccupancy,
      isApproved: participant.oldValues.isApproved,
      oldValues: null
    });

    res.json(updatedParticipant);
  });

  app.get("/api/events/:id/participants", requireAuth, async (req, res) => {
    const { id } = req.params;
    const participants = await storage.getEventParticipants(parseInt(id));

    if (req.user.role === "admin") {
      // For admin, include user details
      const participantsWithDetails = await Promise.all(
        participants.map(async (p) => {
          const user = await storage.getUser(p.userId);
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
    const participants = await storage.getUserParticipations(req.user.id);
    const participationsWithEvents = await Promise.all(
      participants.map(async (p) => {
        const event = await storage.getEvent(p.eventId);
        return { ...p, event };
      })
    );
    res.json(participationsWithEvents);
  });

  // Profil güncelleme route'u
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    const result = insertUserSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Geçersiz kullanıcı verisi",
        errors: result.error.errors
      });
    }

    try {
      // Gravatar URL'ini oluştur
      let avatarUrl = undefined;
      if (result.data.email) {
        const md5 = createHash('md5').update(result.data.email.toLowerCase().trim()).digest('hex');
        avatarUrl = `https://www.gravatar.com/avatar/${md5}?d=mp`;
      }

      const updatedUser = await storage.updateUser(req.user!.id, {
        ...result.data,
        avatarUrl: avatarUrl || result.data.avatarUrl
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        message: "Profil güncellenirken bir hata oluştu"
      });
    }
  });

  // Instagram profil fotoğrafı import endpoint'i
  app.post("/api/user/import-instagram-photo", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);

      if (!user?.instagram) {
        return res.status(400).json({
          message: "Instagram kullanıcı adı bulunamadı"
        });
      }

      try {
        // Instagram Basic Display API ile profil fotoğrafını al
        const response = await axios.get(`https://graph.instagram.com/v12.0/me`, {
          params: {
            fields: 'id,username,profile_picture_url',
            access_token: process.env.INSTAGRAM_CLIENT_ID
          }
        });

        if (response.data?.profile_picture_url) {
          const updatedUser = await storage.updateUser(user.id, {
            avatarUrl: response.data.profile_picture_url
          });

          return res.json(updatedUser);
        }

        throw new Error("Profil fotoğrafı bulunamadı");

      } catch (instagramError) {
        console.error("Instagram API error:", instagramError);

        // Instagram API başarısız olursa Gravatar'a dön
        if (user.email) {
          const md5 = createHash('md5').update(user.email.toLowerCase().trim()).digest('hex');
          const gravatarUrl = `https://www.gravatar.com/avatar/${md5}?d=mp&s=200`;

          const updatedUser = await storage.updateUser(user.id, {
            avatarUrl: gravatarUrl
          });

          return res.json(updatedUser);
        }
      }

      // Hiçbir şey çalışmazsa varsayılan avatar URL'sini kullan
      const updatedUser = await storage.updateUser(user.id, {
        avatarUrl: null // UI'da varsayılan avatar gösterilecek
      });

      return res.json(updatedUser);

    } catch (error) {
      console.error("Profile photo import error:", error);
      res.status(500).json({
        message: "Profil fotoğrafı içe aktarılırken bir hata oluştu"
      });
    }
  });

  // Şifre sıfırlama başlatma endpoint'i
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(400).json({
          message: "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı."
        });
      }

      // Sıfırlama tokeni oluştur
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 saat geçerli

      // Tokeni kaydet
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry: resetTokenExpiry.toISOString()
      });

      // TODO: E-posta gönderme işlemi eklenecek
      // Şimdilik sadece başarılı yanıt dönüyoruz
      res.json({
        message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        message: "Şifre sıfırlama işlemi sırasında bir hata oluştu."
      });
    }
  });

  // Şifre sıfırlama doğrulama ve güncelleme endpoint'i
  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await storage.getUserByResetToken(token);

      if (!user) {
        return res.status(400).json({
          message: "Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı."
        });
      }

      // Token süresini kontrol et
      if (new Date(user.resetTokenExpiry) < new Date()) {
        return res.status(400).json({
          message: "Şifre sıfırlama bağlantısının süresi dolmuş."
        });
      }

      // Yeni şifreyi hashle ve güncelle
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      res.json({
        message: "Şifreniz başarıyla güncellendi."
      });
    } catch (error) {
      console.error("Password reset verification error:", error);
      res.status(500).json({
        message: "Şifre güncelleme işlemi sırasında bir hata oluştu."
      });
    }
  });

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

  async function hashPassword(password: string): Promise<string> {
    //Implementation of password hashing.  This is a placeholder.  Replace with your actual implementation.
    const hash = createHash('sha256').update(password).digest('hex');
    return hash;
  }

  const httpServer = createServer(app);
  return httpServer;
}