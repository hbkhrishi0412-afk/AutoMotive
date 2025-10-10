import Database from 'better-sqlite3';
import path from 'path';
import { connectToMongoDB, getDb as getMongoDB, closeMongoDBConnection } from './mongoConfig';

const USE_MONGODB = process.env.USE_MONGODB === 'true';

let db: any; // This will hold either SQLite or MongoDB connection

export const initializeDatabase = async () => {
  if (USE_MONGODB) {
    await connectToMongoDB();
    db = getMongoDB();
    console.log('MongoDB initialized successfully');
  } else {
    // SQLite configuration
    const DB_PATH = path.join(process.cwd(), 'database', 'automotive.db');
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');

    try {
      // Create users table
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          mobile TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          isVerified BOOLEAN DEFAULT 0,
          dealershipName TEXT,
          bio TEXT,
          logoUrl TEXT,
          subscriptionPlan TEXT,
          featuredCredits INTEGER DEFAULT 0
        );
      `);

      // Create vehicles table
      db.exec(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT,
          make TEXT,
          model TEXT,
          variant TEXT,
          year INTEGER,
          price REAL,
          mileage INTEGER,
          images TEXT, -- JSON string
          features TEXT, -- JSON string
          description TEXT,
          sellerEmail TEXT,
          engine TEXT,
          transmission TEXT,
          fuelType TEXT,
          fuelEfficiency TEXT,
          color TEXT,
          status TEXT,
          isFeatured BOOLEAN DEFAULT 0,
          views INTEGER DEFAULT 0,
          inquiriesCount INTEGER DEFAULT 0,
          registrationYear INTEGER,
          insuranceValidity TEXT,
          insuranceType TEXT,
          rto TEXT,
          city TEXT,
          state TEXT,
          noOfOwners INTEGER,
          displacement TEXT,
          groundClearance TEXT,
          bootSpace TEXT,
          certifiedInspection TEXT, -- JSON string
          videoUrl TEXT,
          serviceRecords TEXT, -- JSON string
          accidentHistory TEXT, -- JSON string
          documents TEXT, -- JSON string
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sellerEmail) REFERENCES users(email)
        );
      `);

      // Create conversations table
      db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          messages TEXT NOT NULL, -- JSON string
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create audit logs table
      db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT,
          action TEXT NOT NULL,
          details TEXT, -- JSON string
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create notifications table
      db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          isRead BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create settings table
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create vehicle data table
      db.exec(`
        CREATE TABLE IF NOT EXISTS vehicle_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          variant TEXT,
          year INTEGER,
          price REAL,
          features TEXT, -- JSON string
          specifications TEXT, -- JSON string
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create FAQ table
      db.exec(`
        CREATE TABLE IF NOT EXISTS faqs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          category TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create support tickets table
      db.exec(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          subject TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT DEFAULT 'open',
          priority TEXT DEFAULT 'medium',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('SQLite Database initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

export const closeDatabase = async () => {
  if (USE_MONGODB) {
    await closeMongoDBConnection();
  } else if (db && db.close) {
    db.close();
    console.log('SQLite database connection closed.');
  }
};
