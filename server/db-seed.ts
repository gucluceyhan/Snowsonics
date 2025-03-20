import { db } from './db';
import { users, events, siteSettings } from '../shared/schema';
import { log } from './vite';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

// Hash password utility function (same as in auth.ts)
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Seed users
async function seedUsers() {
  log('Seeding users...', 'db-seed');

  // Check if admin user already exists
  const existingAdmin = await db.select()
    .from(users)
    .where(eq(users.username, 'admin'));

  if (existingAdmin.length === 0) {
    // Create admin user
    await db.insert(users).values({
      username: 'admin',
      password: await hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phone: '123-456-7890',
      city: 'Demo City',
      occupation: 'Administrator',
      instagram: '@adminuser',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      role: 'admin',
      isApproved: true
    });
    log('Admin user created', 'db-seed');
  } else {
    log('Admin user already exists', 'db-seed');
  }

  // Check if test user already exists
  const existingTestUser = await db.select()
    .from(users)
    .where(eq(users.username, 'user'));

  if (existingTestUser.length === 0) {
    // Create test user
    await db.insert(users).values({
      username: 'user',
      password: await hashPassword('user123'),
      firstName: 'Test',
      lastName: 'User',
      email: 'user@example.com',
      phone: '987-654-3210',
      city: 'Test City',
      occupation: 'Tester',
      instagram: '@testuser',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      role: 'user',
      isApproved: true
    });
    log('Test user created', 'db-seed');
  } else {
    log('Test user already exists', 'db-seed');
  }
}

// Seed events
async function seedEvents() {
  log('Seeding events...', 'db-seed');

  // Check if we have any events
  const existingEvents = await db.select().from(events);

  if (existingEvents.length === 0) {
    // Get admin user to set as creator
    const adminUser = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'));

    if (adminUser.length > 0) {
      const adminId = adminUser[0].id;

      // Create test event
      await db.insert(events).values({
        title: 'Annual Conference 2025',
        description: 'Join us for our annual technology conference',
        content: '<p>This is the annual conference for all technology enthusiasts. There will be keynote speeches, workshops, and networking opportunities.</p><p>Don\'t miss this excellent opportunity to learn and connect with others in the industry.</p>',
        date: new Date(2025, 4, 15),
        endDate: new Date(2025, 4, 17),
        location: 'Tech Center, New York',
        createdById: adminId,
        images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29uZmVyZW5jZXxlbnwwfHwwfHx8MA%3D%3D']
      });
      log('Test event created', 'db-seed');
    }
  } else {
    log('Events already exist, skipping seed', 'db-seed');
  }
}

// Seed site settings
async function seedSiteSettings() {
  log('Seeding site settings...', 'db-seed');

  // Check if we have site settings
  const existingSettings = await db.select().from(siteSettings);

  if (existingSettings.length === 0) {
    await db.insert(siteSettings).values({
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      logoUrl: '/assets/logo.jpeg'
    });
    log('Site settings created', 'db-seed');
  } else {
    log('Site settings already exist, skipping seed', 'db-seed');
  }
}

// Main function to run all seeding
export async function seedDatabase() {
  try {
    log('Starting database seeding...', 'db-seed');
    await seedUsers();
    await seedEvents();
    await seedSiteSettings();
    log('Database seeding completed successfully', 'db-seed');
  } catch (error) {
    log(`Error seeding database: ${error}`, 'db-seed');
  }
}

// We'll call seedDatabase from server/index.ts