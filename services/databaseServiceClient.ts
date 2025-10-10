import type { Vehicle, User, Conversation, AuditLogEntry, Notification, FAQItem, SupportTicket } from '../types';

// Client-side database service that falls back to localStorage
export class DatabaseServiceClient {
  // Users
  static async getUsers(): Promise<User[]> {
    try {
      const usersJson = localStorage.getItem('appUsers');
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error("Failed to fetch users from localStorage", error);
      return [];
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(user => user.email === email) || null;
    } catch (error) {
      console.error("Failed to fetch user from localStorage", error);
      return null;
    }
  }

  static async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    try {
      const users = await this.getUsers();
      const newUser = {
        ...user,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem('appUsers', JSON.stringify(users));
      return newUser;
    } catch (error) {
      console.error("Failed to create user in localStorage", error);
      throw error;
    }
  }

  static async updateUser(email: string, updates: Partial<User>): Promise<void> {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(user => user.email === email);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        localStorage.setItem('appUsers', JSON.stringify(users));
      }
    } catch (error) {
      console.error("Failed to update user in localStorage", error);
      throw error;
    }
  }

  static async deleteUser(email: string): Promise<void> {
    try {
      const users = await this.getUsers();
      const filteredUsers = users.filter(user => user.email !== email);
      localStorage.setItem('appUsers', JSON.stringify(filteredUsers));
    } catch (error) {
      console.error("Failed to delete user from localStorage", error);
      throw error;
    }
  }

  // Vehicles
  static async getVehicles(): Promise<Vehicle[]> {
    try {
      const vehiclesJson = localStorage.getItem('autoVerseVehicles');
      return vehiclesJson ? JSON.parse(vehiclesJson) : [];
    } catch (error) {
      console.error("Failed to fetch vehicles from localStorage", error);
      return [];
    }
  }

  static async getVehicleById(id: number): Promise<Vehicle | null> {
    try {
      const vehicles = await this.getVehicles();
      return vehicles.find(vehicle => vehicle.id === id) || null;
    } catch (error) {
      console.error("Failed to fetch vehicle from localStorage", error);
      return null;
    }
  }

  static async createVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    try {
      const vehicles = await this.getVehicles();
      const newVehicle = {
        ...vehicle,
        id: Date.now() // Simple ID generation
      };
      vehicles.push(newVehicle);
      localStorage.setItem('autoVerseVehicles', JSON.stringify(vehicles));
      return newVehicle;
    } catch (error) {
      console.error("Failed to create vehicle in localStorage", error);
      throw error;
    }
  }

  static async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<void> {
    try {
      const vehicles = await this.getVehicles();
      const vehicleIndex = vehicles.findIndex(vehicle => vehicle.id === id);
      if (vehicleIndex !== -1) {
        vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], ...updates };
        localStorage.setItem('autoVerseVehicles', JSON.stringify(vehicles));
      }
    } catch (error) {
      console.error("Failed to update vehicle in localStorage", error);
      throw error;
    }
  }

  static async deleteVehicle(id: number): Promise<void> {
    try {
      const vehicles = await this.getVehicles();
      const filteredVehicles = vehicles.filter(vehicle => vehicle.id !== id);
      localStorage.setItem('autoVerseVehicles', JSON.stringify(filteredVehicles));
    } catch (error) {
      console.error("Failed to delete vehicle from localStorage", error);
      throw error;
    }
  }

  // Conversations
  static async getConversations(): Promise<Conversation[]> {
    try {
      const conversationsJson = localStorage.getItem('autoVerseConversations');
      return conversationsJson ? JSON.parse(conversationsJson) : [];
    } catch (error) {
      console.error("Failed to fetch conversations from localStorage", error);
      return [];
    }
  }

  static async saveConversations(conversations: Conversation[]): Promise<void> {
    try {
      localStorage.setItem('autoVerseConversations', JSON.stringify(conversations));
    } catch (error) {
      console.error("Failed to save conversations to localStorage", error);
    }
  }

  // Audit Logs
  static async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const logsJson = localStorage.getItem('autoVerseAuditLogs');
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error("Failed to fetch audit logs from localStorage", error);
      return [];
    }
  }

  static async logAction(action: string, userId?: string, details?: any): Promise<void> {
    try {
      const logs = await this.getAuditLogs();
      const newLog: AuditLogEntry = {
        id: Date.now().toString(),
        userId: userId || '',
        action,
        details,
        timestamp: new Date().toISOString()
      };
      logs.push(newLog);
      localStorage.setItem('autoVerseAuditLogs', JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to log action to localStorage", error);
    }
  }

  // Notifications
  static async getNotifications(): Promise<Notification[]> {
    try {
      const notificationsJson = localStorage.getItem('autoVerseNotifications');
      return notificationsJson ? JSON.parse(notificationsJson) : [];
    } catch (error) {
      console.error("Failed to fetch notifications from localStorage", error);
      return [];
    }
  }

  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      notifications.push(newNotification);
      localStorage.setItem('autoVerseNotifications', JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to create notification in localStorage", error);
    }
  }

  // Settings
  static async getSettings(): Promise<Record<string, any>> {
    try {
      const settingsJson = localStorage.getItem('autoVersePlatformSettings');
      return settingsJson ? JSON.parse(settingsJson) : {};
    } catch (error) {
      console.error("Failed to fetch settings from localStorage", error);
      return {};
    }
  }

  static async saveSettings(settings: Record<string, any>): Promise<void> {
    try {
      localStorage.setItem('autoVersePlatformSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }

  // FAQs
  static async getFAQs(): Promise<FAQItem[]> {
    try {
      const faqsJson = localStorage.getItem('autoVerseFAQs');
      return faqsJson ? JSON.parse(faqsJson) : [];
    } catch (error) {
      console.error("Failed to fetch FAQs from localStorage", error);
      return [];
    }
  }

  // Support Tickets
  static async getSupportTickets(): Promise<SupportTicket[]> {
    try {
      const ticketsJson = localStorage.getItem('autoVerseSupportTickets');
      return ticketsJson ? JSON.parse(ticketsJson) : [];
    } catch (error) {
      console.error("Failed to fetch support tickets from localStorage", error);
      return [];
    }
  }

  static async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const tickets = await this.getSupportTickets();
      const newTicket: SupportTicket = {
        ...ticket,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tickets.push(newTicket);
      localStorage.setItem('autoVerseSupportTickets', JSON.stringify(tickets));
    } catch (error) {
      console.error("Failed to create support ticket in localStorage", error);
    }
  }
}
