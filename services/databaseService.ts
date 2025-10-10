import { db } from '../database/config';
import type { Vehicle, User, Conversation, AuditLogEntry, Notification, FAQItem, SupportTicket } from '../types';
import { initializeDatabase, getDb, closeDatabase } from '../database/config';
import { MongoDatabaseService } from './mongoDatabaseService';

const USE_MONGODB = process.env.USE_MONGODB === 'true';

const getService = () => {
  if (USE_MONGODB) {
    return MongoDatabaseService;
  } else {
    // Original SQLite methods
    return class SQLiteDatabaseService {
      static async getUsers(): Promise<User[]> {
        const stmt = getDb().prepare('SELECT * FROM users ORDER BY name ASC');
        const rows = stmt.all() as any[];
        
        return rows.map(row => ({
          ...row,
          isVerified: Boolean(row.isVerified),
          createdAt: new Date(row.createdAt).toISOString(),
          featuredCredits: row.featuredCredits || 0
        }));
      }
    
      static async getUserByEmail(email: string): Promise<User | null> {
        const stmt = getDb().prepare('SELECT * FROM users WHERE email = ?');
        const row = stmt.get(email) as any;
        
        if (!row) return null;
        
        return {
          ...row,
          isVerified: Boolean(row.isVerified),
          createdAt: new Date(row.createdAt).toISOString(),
          featuredCredits: row.featuredCredits || 0
        };
      }
    
      static async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
        const stmt = getDb().prepare(`
          INSERT INTO users (name, email, password, mobile, role, status, isVerified, dealershipName, bio, logoUrl, subscriptionPlan, featuredCredits)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
          user.name,
          user.email,
          user.password,
          user.mobile,
          user.role,
          user.status,
          user.isVerified ? 1 : 0,
          user.dealershipName || null,
          user.bio || null,
          user.logoUrl || null,
          user.subscriptionPlan || null,
          user.featuredCredits || 0
        );
    
        return {
          ...user,
          createdAt: new Date().toISOString()
        };
      }
    
      static async updateUser(email: string, updates: Partial<User>): Promise<void> {
        const fields = Object.keys(updates).filter(key => key !== 'email' && key !== 'createdAt');
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => {
          const value = updates[field as keyof User];
          if (field === 'isVerified') return value ? 1 : 0;
          return value;
        });
    
        const stmt = getDb().prepare(`UPDATE users SET ${setClause} WHERE email = ?`);
        stmt.run(...values, email);
      }
    
      static async deleteUser(email: string): Promise<void> {
        const stmt = getDb().prepare('DELETE FROM users WHERE email = ?');
        stmt.run(email);
      }
    
      // Vehicles
      static async getVehicles(): Promise<Vehicle[]> {
        const stmt = getDb().prepare('SELECT * FROM vehicles ORDER BY createdAt DESC');
        const rows = stmt.all() as any[];
        
        return rows.map(row => ({
          ...row,
          images: JSON.parse(row.images || '[]'),
          features: JSON.parse(row.features || '[]'),
          isFeatured: Boolean(row.isFeatured),
          certifiedInspection: row.certifiedInspection ? JSON.parse(row.certifiedInspection) : null,
          serviceRecords: row.serviceRecords ? JSON.parse(row.serviceRecords) : null,
          accidentHistory: row.accidentHistory ? JSON.parse(row.accidentHistory) : null,
          documents: row.documents ? JSON.parse(row.documents) : null,
          views: row.views || 0,
          inquiriesCount: row.inquiriesCount || 0
        }));
      }
    
      static async getVehicleById(id: number): Promise<Vehicle | null> {
        const stmt = getDb().prepare('SELECT * FROM vehicles WHERE id = ?');
        const row = stmt.get(id) as any;
        
        if (!row) return null;
        
        return {
          ...row,
          images: JSON.parse(row.images || '[]'),
          features: JSON.parse(row.features || '[]'),
          isFeatured: Boolean(row.isFeatured),
          certifiedInspection: row.certifiedInspection ? JSON.parse(row.certifiedInspection) : null,
          serviceRecords: row.serviceRecords ? JSON.parse(row.serviceRecords) : null,
          accidentHistory: row.accidentHistory ? JSON.parse(row.accidentHistory) : null,
          documents: row.documents ? JSON.parse(row.documents) : null,
          views: row.views || 0,
          inquiriesCount: row.inquiriesCount || 0
        };
      }
    
      static async createVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
        const stmt = getDb().prepare(`
          INSERT INTO vehicles (
            category, make, model, variant, year, price, mileage, images, features, description,
            sellerEmail, engine, transmission, fuelType, fuelEfficiency, color, status, isFeatured,
            views, inquiriesCount, registrationYear, insuranceValidity, insuranceType, rto, city, state,
            noOfOwners, displacement, groundClearance, bootSpace, certifiedInspection, videoUrl,
            serviceRecords, accidentHistory, documents
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
          vehicle.category,
          vehicle.make,
          vehicle.model,
          vehicle.variant,
          vehicle.year,
          vehicle.price,
          vehicle.mileage,
          JSON.stringify(vehicle.images),
          JSON.stringify(vehicle.features),
          vehicle.description,
          vehicle.sellerEmail,
          vehicle.engine,
          vehicle.transmission,
          vehicle.fuelType,
          vehicle.fuelEfficiency,
          vehicle.color,
          vehicle.status,
          vehicle.isFeatured ? 1 : 0,
          vehicle.views || 0,
          vehicle.inquiriesCount || 0,
          vehicle.registrationYear,
          vehicle.insuranceValidity,
          vehicle.insuranceType,
          vehicle.rto,
          vehicle.city,
          vehicle.state,
          vehicle.noOfOwners,
          vehicle.displacement,
          vehicle.groundClearance,
          vehicle.bootSpace,
          vehicle.certifiedInspection ? JSON.stringify(vehicle.certifiedInspection) : null,
          vehicle.videoUrl,
          vehicle.serviceRecords ? JSON.stringify(vehicle.serviceRecords) : null,
          vehicle.accidentHistory ? JSON.stringify(vehicle.accidentHistory) : null,
          vehicle.documents ? JSON.stringify(vehicle.documents) : null
        );
    
        return {
          ...vehicle,
          id: result.lastInsertRowid as number
        };
      }
    
      static async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<void> {
        const fields = Object.keys(updates).filter(key => key !== 'id');
        const setClause = fields.map(field => {
          if (field === 'images' || field === 'features' || field === 'certifiedInspection' || 
              field === 'serviceRecords' || field === 'accidentHistory' || field === 'documents') {
            return `${field} = ?`;
          }
          return `${field} = ?`;
        }).join(', ');
        
        const values = fields.map(field => {
          const value = updates[field as keyof Vehicle];
          if (field === 'isFeatured') return value ? 1 : 0;
          if (field === 'images' || field === 'features' || field === 'certifiedInspection' || 
              field === 'serviceRecords' || field === 'accidentHistory' || field === 'documents') {
            return JSON.stringify(value);
          }
          return value;
        });
    
        const stmt = getDb().prepare(`UPDATE vehicles SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
      }
    
      static async deleteVehicle(id: number): Promise<void> {
        const stmt = getDb().prepare('DELETE FROM vehicles WHERE id = ?');
        stmt.run(id);
      }
    
      // Conversations
      static async getConversations(): Promise<Conversation[]> {
        const stmt = getDb().prepare('SELECT * FROM conversations ORDER BY updatedAt DESC');
        const rows = stmt.all() as any[];
        
        return rows.map(row => ({
          ...row,
          messages: JSON.parse(row.messages || '[]'),
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString()
        }));
      }
    
      static async saveConversations(conversations: Conversation[]): Promise<void> {
        const deleteStmt = getDb().prepare('DELETE FROM conversations');
        deleteStmt.run();
    
        const insertStmt = getDb().prepare(`
          INSERT INTO conversations (userId, messages)
          VALUES (?, ?)
        `);
    
        conversations.forEach(conv => {
          insertStmt.run(conv.userId, JSON.stringify(conv.messages));
        });
      }
    
      // Audit Logs
      static async getAuditLogs(): Promise<AuditLogEntry[]> {
        const stmt = getDb().prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC');
        const rows = stmt.all() as any[];
        
        return rows.map(row => ({
          ...row,
          details: row.details ? JSON.parse(row.details) : null,
          timestamp: new Date(row.timestamp).toISOString()
        }));
      }
    
      static async logAction(action: string, userId?: string, details?: any): Promise<void> {
        const stmt = getDb().prepare(`
          INSERT INTO audit_logs (userId, action, details)
          VALUES (?, ?, ?)
        `);
        
        stmt.run(userId || null, action, details ? JSON.stringify(details) : null);
      }
    
      // Notifications
      static async getNotifications(): Promise<Notification[]> {
        const stmt = getDb().prepare('SELECT * FROM notifications ORDER BY createdAt DESC');
        const rows = stmt.all() as any[];
        
        return rows.map(row => ({
          ...row,
          isRead: Boolean(row.isRead),
          createdAt: new Date(row.createdAt).toISOString()
        }));
      }
    
      static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
        const stmt = getDb().prepare(`
          INSERT INTO notifications (userId, title, message, type, isRead)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          notification.userId,
          notification.title,
          notification.message,
          notification.type,
          notification.isRead ? 1 : 0
        );
      }
    
      // Settings
      static async getSettings(): Promise<Record<string, any>> {
        const stmt = getDb().prepare('SELECT key, value FROM settings');
        const rows = stmt.all() as any[];
        
        const settings: Record<string, any> = {};
        rows.forEach(row => {
          try {
            settings[row.key] = JSON.parse(row.value);
          } catch {
            settings[row.key] = row.value;
          }
        });
        
        return settings;
      }
    
      static async saveSettings(settings: Record<string, any>): Promise<void> {
        const stmt = getDb().prepare(`
          INSERT OR REPLACE INTO settings (key, value)
          VALUES (?, ?)
        `);
        
        Object.entries(settings).forEach(([key, value]) => {
          stmt.run(key, JSON.stringify(value));
        });
      }
    
      // FAQs
      static async getFAQs(): Promise<FAQItem[]> {
        const stmt = getDb().prepare('SELECT * FROM faqs ORDER BY createdAt DESC');
        const rows = stmt.all() as any[];
        
        return rows.map(row => ({
          ...row,
          createdAt: new Date(row.createdAt).toISOString()
        }));
      }
    
      // Support Tickets
      static async getSupportTickets(): Promise<SupportTicket[]> {
        const stmt = getDb().prepare('SELECT * FROM support_tickets ORDER BY createdAt DESC');
        const rows = stmt.all() as any[];
        
        return rows.map(row => ({
          ...row,
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString()
        }));
      }
    
      static async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
        const stmt = getDb().prepare(`
          INSERT INTO support_tickets (userId, subject, description, status, priority)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          ticket.userId,
          ticket.subject,
          ticket.description,
          ticket.status,
          ticket.priority
        );
      }
    };
  }
};

export const DatabaseService = getService();

export { initializeDatabase, closeDatabase };
