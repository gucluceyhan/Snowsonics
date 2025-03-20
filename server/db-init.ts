import mysql from 'mysql2/promise';
import { log } from './vite';
import { MySQLStorage } from './mysql-storage';
import { IStorage } from './types';
import { MemStorage } from './storage';

// Function to extract connection parameters from PostgreSQL URL 
function parseDbUrl(url: string): mysql.PoolOptions {
  try {
    // Try the standard URL format first
    const pgUrl = new URL(url);
    
    // Extract database name from pathname (remove leading slash)
    const database = pgUrl.pathname.substring(1);
    
    return {
      host: pgUrl.hostname,
      port: parseInt(pgUrl.port || '5432'),
      user: pgUrl.username,
      password: pgUrl.password,
      database: database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    
    // Fallback to regex pattern matching for non-standard URLs
    const matches = url.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!matches) {
      throw new Error('Invalid DATABASE_URL format. Expected format: postgres://user:password@host:port/database');
    }
    
    const [, user, password, host, port, database] = matches;
    
    return {
      host,
      port: parseInt(port),
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }
}

// Initialize database tables
async function initializeTables(pool: mysql.Pool): Promise<void> {
  try {
    log('Creating database tables if they don\'t exist', 'db-init');
    
    const connection = await pool.getConnection();
    
    // Create tables if they don't exist - using MySQL syntax
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        logo_url TEXT,
        primary_color VARCHAR(20) NOT NULL,
        secondary_color VARCHAR(20) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(200) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        city VARCHAR(100) NOT NULL,
        occupation VARCHAR(100) NOT NULL,
        instagram VARCHAR(100),
        avatar_url TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        is_approved BOOLEAN NOT NULL DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        content TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        location VARCHAR(200) NOT NULL,
        images JSON NOT NULL,
        created_by_id INT NOT NULL,
        FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS event_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        status VARCHAR(20) NOT NULL,
        is_approved BOOLEAN NOT NULL DEFAULT FALSE,
        room_type VARCHAR(20),
        room_occupancy INT,
        payment_status VARCHAR(20) DEFAULT 'pending',
        old_values JSON,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (event_id, user_id)
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) NOT NULL,
        expires INT UNSIGNED NOT NULL,
        data TEXT,
        PRIMARY KEY (session_id)
      );
    `);
    
    connection.release();
    log('Database tables created successfully', 'db-init');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
}

// Insert test data if tables are empty
async function seedTestData(pool: mysql.Pool): Promise<void> {
  try {
    const connection = await pool.getConnection();
    
    // Check if the admin user already exists
    const [adminRows] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      ['admin']
    );
    
    if (!Array.isArray(adminRows) || adminRows.length === 0) {
      // Insert a default admin user
      await connection.execute(
        'INSERT INTO users (username, password, first_name, last_name, email, phone, city, occupation, role, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          'admin',
          'd9b0636fc082c9db1a63dac05e129eb7cfd968c3de1611d1a5b9e9bccba92d1f', // 'admin123' - Only for development
          'Admin',
          'User',
          'admin@example.com',
          '5551234567',
          'Default City',
          'Administrator',
          'admin',
          true
        ]
      );
      log('Created default admin user', 'db-init');
    }
    
    // Check if site settings exist
    const [settingsRows] = await connection.execute('SELECT * FROM site_settings LIMIT 1');
    
    if (!Array.isArray(settingsRows) || settingsRows.length === 0) {
      // Insert default site settings
      await connection.execute(
        'INSERT INTO site_settings (logo_url, primary_color, secondary_color) VALUES (?, ?, ?)',
        ['/assets/new_whatsons_logo.png', '#4F45E4', '#171717']
      );
      log('Created default site settings', 'db-init');
    }
    
    // Create a test event if none exist
    const [eventsRows] = await connection.execute('SELECT * FROM events LIMIT 1');
    
    if (!Array.isArray(eventsRows) || eventsRows.length === 0) {
      const [adminUserRows] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        ['admin']
      );
      
      if (Array.isArray(adminUserRows) && adminUserRows.length > 0) {
        const adminId = (adminUserRows[0] as any).id;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        
        await connection.execute(
          'INSERT INTO events (title, description, content, date, end_date, location, images, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            '15-19 Nisan 2025 Kars Sarıkamış Turu',
            'Katılımcıların kendilerini zorlayacakları, doğa ile iç içe olacakları, günlük şehir hayatından uzaklaşarak kendilerini keşfedebilecekleri ve unutulmaz anılar biriktirebilecekleri bir macera!',
            'Detaylı içerik buraya gelecek',
            new Date(),
            futureDate,
            'Kars, Türkiye',
            JSON.stringify(['/assets/kars-event.jpg']),
            adminId
          ]
        );
        log('Created sample event', 'db-init');
      }
    }
    
    connection.release();
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}

// Initialize storage based on environment
export async function initializeStorage(): Promise<IStorage> {
  const DB_URL = process.env.DATABASE_URL;
  
  if (DB_URL) {
    try {
      log('Initializing MySQL storage with PostgreSQL database', 'db-init');
      
      // Parse connection details
      const dbConfig = parseDbUrl(DB_URL);
      
      // Create pool and test connection
      const pool = mysql.createPool(dbConfig);
      const connection = await pool.getConnection();
      connection.release();
      
      // Initialize tables
      await initializeTables(pool);
      
      // Seed test data
      await seedTestData(pool);
      
      // Create MySQL storage
      const mysqlStorage = new MySQLStorage(dbConfig);
      
      log('MySQL storage initialized successfully', 'db-init');
      return mysqlStorage;
    } catch (error) {
      console.error('Failed to initialize MySQL storage:', error);
      console.warn('Falling back to in-memory storage');
      return new MemStorage();
    }
  } else {
    log('No DATABASE_URL found, using in-memory storage', 'db-init');
    return new MemStorage();
  }
}