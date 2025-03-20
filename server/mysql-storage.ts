import { IStorage } from "./types";
import { Event, EventParticipant, InsertEvent, InsertEventParticipant, InsertSiteSettings, InsertUser, SiteSettings, User } from '../shared/schema';
import mysql from 'mysql2/promise';
import { log } from './vite';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';

// Store factory requires a non-promisified MySQL session
import mysqlNonPromise from 'mysql2';

export class MySQLStorage implements IStorage {
  private pool: mysql.Pool;
  sessionStore: session.Store;

  constructor(dbConfig: mysql.PoolOptions) {
    // Create MySQL connection pool
    this.pool = mysql.createPool(dbConfig);
    
    // Set up MySQL session store
    const MySQLStore = MySQLStoreFactory(session);
    
    // Create session store using non-promise version of mysql2
    this.sessionStore = new MySQLStore({
      host: dbConfig.host,
      port: dbConfig.port as number,
      user: dbConfig.user,
      password: dbConfig.password as string,
      database: dbConfig.database as string,
      createDatabaseTable: true,
    }, mysqlNonPromise.createPool({
      host: dbConfig.host,
      port: dbConfig.port as number,
      user: dbConfig.user,
      password: dbConfig.password as string,
      database: dbConfig.database as string,
      waitForConnections: true,
      connectionLimit: 10,
    }));
    
    log('MySQL storage initialized', 'mysql-storage');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    const users = rows as User[];
    return users.length > 0 ? users[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    const users = rows as User[];
    return users.length > 0 ? users[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check if this is the first user to set role and approval
    const [countResult] = await this.pool.execute('SELECT COUNT(*) as count FROM users');
    const isFirstUser = (countResult as any[])[0].count === 0;
    
    const [result] = await this.pool.execute(
      `INSERT INTO users (
        username, password, first_name, last_name, email, phone, 
        city, occupation, instagram, avatar_url, role, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        insertUser.username,
        insertUser.password,
        insertUser.firstName,
        insertUser.lastName,
        insertUser.email,
        insertUser.phone,
        insertUser.city,
        insertUser.occupation,
        insertUser.instagram || null,
        null, // avatarUrl
        isFirstUser ? 'admin' : 'user',
        isFirstUser ? 1 : 0, // isApproved
      ]
    );
    
    const id = (result as mysql.ResultSetHeader).insertId;
    return this.getUser(id) as Promise<User>;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    // Build the SET part of the query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.username !== undefined) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    
    if (updates.password !== undefined) {
      fields.push('password = ?');
      values.push(updates.password);
    }
    
    if (updates.firstName !== undefined) {
      fields.push('first_name = ?');
      values.push(updates.firstName);
    }
    
    if (updates.lastName !== undefined) {
      fields.push('last_name = ?');
      values.push(updates.lastName);
    }
    
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    
    if (updates.city !== undefined) {
      fields.push('city = ?');
      values.push(updates.city);
    }
    
    if (updates.occupation !== undefined) {
      fields.push('occupation = ?');
      values.push(updates.occupation);
    }
    
    if (updates.instagram !== undefined) {
      fields.push('instagram = ?');
      values.push(updates.instagram);
    }
    
    if (updates.avatarUrl !== undefined) {
      fields.push('avatar_url = ?');
      values.push(updates.avatarUrl);
    }
    
    if (updates.role !== undefined) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    
    if (updates.isApproved !== undefined) {
      fields.push('is_approved = ?');
      values.push(updates.isApproved ? 1 : 0);
    }
    
    if (fields.length === 0) {
      return this.getUser(id) as Promise<User>;
    }
    
    // Add the ID to the values array
    values.push(id);
    
    await this.pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getUser(id) as Promise<User>;
  }

  async getAllUsers(): Promise<User[]> {
    const [rows] = await this.pool.execute('SELECT * FROM users');
    return rows as User[];
  }

  // Event methods
  async createEvent(event: InsertEvent & { createdById: number }): Promise<Event> {
    const [result] = await this.pool.execute(
      `INSERT INTO events (
        title, description, content, date, end_date, location, images, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.title,
        event.description,
        event.content,
        new Date(event.date),
        new Date(event.endDate),
        event.location,
        JSON.stringify(event.images || []),
        event.createdById
      ]
    );
    
    const id = (result as mysql.ResultSetHeader).insertId;
    return this.getEvent(id) as Promise<Event>;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    
    const events = rows as any[];
    
    if (events.length === 0) {
      return undefined;
    }
    
    // Parse the JSON images field
    const event = events[0];
    return {
      ...event,
      images: JSON.parse(event.images)
    };
  }

  async getAllEvents(): Promise<Event[]> {
    const [rows] = await this.pool.execute('SELECT * FROM events');
    
    // Parse the JSON images field for each event
    return (rows as any[]).map(event => ({
      ...event,
      images: JSON.parse(event.images)
    }));
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    // Build the SET part of the query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(new Date(updates.date));
    }
    
    if (updates.endDate !== undefined) {
      fields.push('end_date = ?');
      values.push(new Date(updates.endDate));
    }
    
    if (updates.location !== undefined) {
      fields.push('location = ?');
      values.push(updates.location);
    }
    
    if (updates.images !== undefined) {
      fields.push('images = ?');
      values.push(JSON.stringify(updates.images));
    }
    
    if (fields.length === 0) {
      return this.getEvent(id) as Promise<Event>;
    }
    
    // Add the ID to the values array
    values.push(id);
    
    await this.pool.execute(
      `UPDATE events SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getEvent(id) as Promise<Event>;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM events WHERE id = ?', [id]);
  }

  // Event participant methods
  async addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant> {
    const [result] = await this.pool.execute(
      `INSERT INTO event_participants (
        event_id, user_id, status, room_type, room_occupancy, payment_status, old_values
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        participant.eventId,
        participant.userId,
        participant.status,
        participant.roomType || null,
        participant.roomOccupancy || null,
        participant.paymentStatus || 'pending',
        participant.oldValues ? JSON.stringify(participant.oldValues) : null
      ]
    );
    
    const id = (result as mysql.ResultSetHeader).insertId;
    const [rows] = await this.pool.execute(
      'SELECT * FROM event_participants WHERE id = ?',
      [id]
    );
    
    const participants = rows as any[];
    
    if (participants.length === 0) {
      throw new Error('Failed to create event participant');
    }
    
    // Parse the JSON old_values field
    const createdParticipant = participants[0];
    return {
      ...createdParticipant,
      oldValues: createdParticipant.old_values ? JSON.parse(createdParticipant.old_values) : null
    };
  }

  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM event_participants WHERE event_id = ?',
      [eventId]
    );
    
    // Parse the JSON old_values field for each participant
    return (rows as any[]).map(participant => ({
      ...participant,
      oldValues: participant.old_values ? JSON.parse(participant.old_values) : null
    }));
  }

  async updateEventParticipant(id: number, updates: Partial<EventParticipant>): Promise<EventParticipant> {
    // Build the SET part of the query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    
    if (updates.isApproved !== undefined) {
      fields.push('is_approved = ?');
      values.push(updates.isApproved ? 1 : 0);
    }
    
    if (updates.roomType !== undefined) {
      fields.push('room_type = ?');
      values.push(updates.roomType);
    }
    
    if (updates.roomOccupancy !== undefined) {
      fields.push('room_occupancy = ?');
      values.push(updates.roomOccupancy);
    }
    
    if (updates.paymentStatus !== undefined) {
      fields.push('payment_status = ?');
      values.push(updates.paymentStatus);
    }
    
    if (updates.oldValues !== undefined) {
      fields.push('old_values = ?');
      values.push(updates.oldValues ? JSON.stringify(updates.oldValues) : null);
    }
    
    if (fields.length === 0) {
      const [rows] = await this.pool.execute(
        'SELECT * FROM event_participants WHERE id = ?',
        [id]
      );
      
      const participants = rows as any[];
      
      if (participants.length === 0) {
        throw new Error('Participant not found');
      }
      
      // Parse the JSON old_values field
      const participant = participants[0];
      return {
        ...participant,
        oldValues: participant.old_values ? JSON.parse(participant.old_values) : null
      };
    }
    
    // Add the ID to the values array
    values.push(id);
    
    await this.pool.execute(
      `UPDATE event_participants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await this.pool.execute(
      'SELECT * FROM event_participants WHERE id = ?',
      [id]
    );
    
    const participants = rows as any[];
    
    if (participants.length === 0) {
      throw new Error('Participant not found');
    }
    
    // Parse the JSON old_values field
    const participant = participants[0];
    return {
      ...participant,
      oldValues: participant.old_values ? JSON.parse(participant.old_values) : null
    };
  }

  async getUserParticipations(userId: number): Promise<EventParticipant[]> {
    const [rows] = await this.pool.execute(
      'SELECT p.*, e.* FROM event_participants p JOIN events e ON p.event_id = e.id WHERE p.user_id = ?',
      [userId]
    );
    
    // Process the joined result to return event participants with event data
    return (rows as any[]).map(row => {
      const participant = {
        id: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        status: row.status,
        isApproved: Boolean(row.is_approved),
        roomType: row.room_type,
        roomOccupancy: row.room_occupancy,
        paymentStatus: row.payment_status,
        oldValues: row.old_values ? JSON.parse(row.old_values) : null,
        event: {
          id: row.id,
          title: row.title,
          description: row.description,
          content: row.content,
          date: row.date,
          endDate: row.end_date,
          location: row.location,
          images: JSON.parse(row.images),
          createdById: row.created_by_id
        }
      };
      
      return participant;
    });
  }

  async getUserEventParticipation(userId: number, eventId: number): Promise<EventParticipant | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM event_participants WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );
    
    const participants = rows as any[];
    
    if (participants.length === 0) {
      return undefined;
    }
    
    // Parse the JSON old_values field
    const participant = participants[0];
    return {
      ...participant,
      oldValues: participant.old_values ? JSON.parse(participant.old_values) : null
    };
  }

  // Site settings methods
  async getSiteSettings(): Promise<SiteSettings | null> {
    const [rows] = await this.pool.execute('SELECT * FROM site_settings LIMIT 1');
    
    const settings = rows as SiteSettings[];
    return settings.length > 0 ? settings[0] : null;
  }

  async updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    // Get current settings
    const currentSettings = await this.getSiteSettings();
    
    if (currentSettings) {
      // Update existing settings
      const fields: string[] = [];
      const values: any[] = [];
      
      if (settings.logoUrl !== undefined) {
        fields.push('logo_url = ?');
        values.push(settings.logoUrl);
      }
      
      if (settings.primaryColor !== undefined) {
        fields.push('primary_color = ?');
        values.push(settings.primaryColor);
      }
      
      if (settings.secondaryColor !== undefined) {
        fields.push('secondary_color = ?');
        values.push(settings.secondaryColor);
      }
      
      // Add updated_at timestamp
      fields.push('updated_at = ?');
      values.push(new Date());
      
      // Add ID for WHERE clause
      values.push(currentSettings.id);
      
      await this.pool.execute(
        `UPDATE site_settings SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return this.getSiteSettings() as Promise<SiteSettings>;
    } else {
      // Insert new settings
      const [result] = await this.pool.execute(
        'INSERT INTO site_settings (logo_url, primary_color, secondary_color, updated_at) VALUES (?, ?, ?, ?)',
        [
          settings.logoUrl || null,
          settings.primaryColor,
          settings.secondaryColor,
          new Date()
        ]
      );
      
      return this.getSiteSettings() as Promise<SiteSettings>;
    }
  }
}