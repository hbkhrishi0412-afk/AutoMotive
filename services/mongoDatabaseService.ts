import { getDb } from '../database/mongoConfig';
import type { Vehicle, User, Conversation, AuditLogEntry, Notification, FAQItem, SupportTicket } from '../types';
import { Collection } from 'mongodb';

export class MongoDatabaseService {
  private static getUsersCollection(): Collection<User> {
    return getDb().collection<User>('users');
  }

  private static getVehiclesCollection(): Collection<Vehicle> {
    return getDb().collection<Vehicle>('vehicles');
  }

  private static getConversationsCollection(): Collection<Conversation> {
    return getDb().collection<Conversation>('conversations');
  }

  private static getAuditLogsCollection(): Collection<AuditLogEntry> {
    return getDb().collection<AuditLogEntry>('audit_logs');
  }

  private static getNotificationsCollection(): Collection<Notification> {
    return getDb().collection<Notification>('notifications');
  }

  private static getSettingsCollection(): Collection<{ key: string, value: any }> {
    return getDb().collection<{ key: string, value: any }>('settings');
  }

  private static getVehicleDataCollection(): Collection<any> {
    return getDb().collection<any>('vehicle_data');
  }

  private static getFaqsCollection(): Collection<FAQItem> {
    return getDb().collection<FAQItem>('faqs');
  }

  private static getSupportTicketsCollection(): Collection<SupportTicket> {
    return getDb().collection<SupportTicket>('support_tickets');
  }

  // Users
  static async getUsers(): Promise<User[]> {
    return await this.getUsersCollection().find().sort({ name: 1 }).toArray();
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return await this.getUsersCollection().findOne({ email });
  }

  static async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    const userWithTimestamp = { ...user, createdAt: new Date().toISOString() };
    const result = await this.getUsersCollection().insertOne(userWithTimestamp as User);
    return { ...userWithTimestamp, id: result.insertedId.toHexString() as any }; // MongoDB _id to id
  }

  static async updateUser(email: string, updates: Partial<User>): Promise<void> {
    await this.getUsersCollection().updateOne({ email }, { $set: updates });
  }

  static async deleteUser(email: string): Promise<void> {
    await this.getUsersCollection().deleteOne({ email });
  }

  // Vehicles
  static async getVehicles(): Promise<Vehicle[]> {
    const vehicles = await this.getVehiclesCollection().find().sort({ createdAt: -1 }).toArray();
    return vehicles.map(v => ({ ...v, id: v._id.toHexString() as any }));
  }

  static async getVehicleById(id: number): Promise<Vehicle | null> {
    // For MongoDB, if id is ObjectId, convert it. If it's a number from SQLite, we might need a different lookup.
    // Assuming for now that 'id' in MongoDB will be '_id' as string.
    // This will need adjustment based on how vehicle IDs are managed in MongoDB.
    // For simplicity, let's assume we store the old SQLite 'id' as a field 'sqliteId' in MongoDB documents if needed.
    // Or, if 'id' is a string in the new system, we can use it directly.
    // For now, let's treat id as a string (MongoDB _id) for lookup.
    // This needs to be clarified: how will `id` in `Vehicle` type relate to MongoDB's `_id`?
    // For now, I'm going to assume the `id` in the `Vehicle` type is a string that matches MongoDB's `_id`.
    const vehicle = await this.getVehiclesCollection().findOne({ _id: id as any }); // Assuming id can be ObjectId
    if (!vehicle) return null;
    return { ...vehicle, id: vehicle._id.toHexString() as any };
  }

  static async createVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const vehicleWithTimestamp = { ...vehicle, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const result = await this.getVehiclesCollection().insertOne(vehicleWithTimestamp as Vehicle);
    return { ...vehicleWithTimestamp, id: result.insertedId.toHexString() as any };
  }

  static async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<void> {
    await this.getVehiclesCollection().updateOne({ _id: id as any }, { $set: { ...updates, updatedAt: new Date().toISOString() } });
  }

  static async deleteVehicle(id: number): Promise<void> {
    await this.getVehiclesCollection().deleteOne({ _id: id as any });
  }

  // Conversations
  static async getConversations(): Promise<Conversation[]> {
    const conversations = await this.getConversationsCollection().find().sort({ updatedAt: -1 }).toArray();
    return conversations.map(c => ({ ...c, id: c._id.toHexString() as any }));
  }

  static async saveConversations(conversations: Conversation[]): Promise<void> {
    // In MongoDB, we might clear and insert or upsert. For simplicity, let's assume a clear and insert approach if the `id` is not consistent with MongoDB `_id`.
    // If conversations have consistent `_id`s, we could upsert.
    // For now, a simpler approach: delete all and insert new ones or handle individual updates.
    // This method needs careful consideration for MongoDB, as the original SQLite version deletes all and re-inserts.
    // Let's implement it with upserting or replacing if the IDs are managed.
    await this.getConversationsCollection().deleteMany({}); // Clear all conversations
    if (conversations.length > 0) {
      await this.getConversationsCollection().insertMany(conversations as Conversation[]);
    }
  }

  // Audit Logs
  static async getAuditLogs(): Promise<AuditLogEntry[]> {
    const logs = await this.getAuditLogsCollection().find().sort({ timestamp: -1 }).toArray();
    return logs.map(l => ({ ...l, id: l._id.toHexString() as any }));
  }

  static async logAction(action: string, userId?: string, details?: any): Promise<void> {
    const logEntry = { action, userId: userId || null, details, timestamp: new Date().toISOString() };
    await this.getAuditLogsCollection().insertOne(logEntry as AuditLogEntry);
  }

  // Notifications
  static async getNotifications(): Promise<Notification[]> {
    const notifications = await this.getNotificationsCollection().find().sort({ createdAt: -1 }).toArray();
    return notifications.map(n => ({ ...n, id: n._id.toHexString() as any }));
  }

  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    const notificationWithTimestamp = { ...notification, createdAt: new Date().toISOString(), isRead: notification.isRead || false };
    await this.getNotificationsCollection().insertOne(notificationWithTimestamp as Notification);
  }

  // Settings
  static async getSettings(): Promise<Record<string, any>> {
    const settingsArray = await this.getSettingsCollection().find().toArray();
    const settings: Record<string, any> = {};
    settingsArray.forEach(s => {
      try {
        settings[s.key] = JSON.parse(s.value);
      } catch {
        settings[s.key] = s.value;
      }
    });
    return settings;
  }

  static async saveSettings(settings: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.getSettingsCollection().updateOne(
        { key },
        { $set: { value: JSON.stringify(value), updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    }
  }

  // FAQs
  static async getFAQs(): Promise<FAQItem[]> {
    const faqs = await this.getFaqsCollection().find().sort({ createdAt: -1 }).toArray();
    return faqs.map(f => ({ ...f, id: f._id.toHexString() as any }));
  }

  // Support Tickets
  static async getSupportTickets(): Promise<SupportTicket[]> {
    const tickets = await this.getSupportTicketsCollection().find().sort({ createdAt: -1 }).toArray();
    return tickets.map(t => ({ ...t, id: t._id.toHexString() as any }));
  }

  static async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const ticketWithTimestamps = { ...ticket, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await this.getSupportTicketsCollection().insertOne(ticketWithTimestamps as SupportTicket);
  }
}
