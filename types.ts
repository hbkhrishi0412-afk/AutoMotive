import { ChartData } from 'chart.js';

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  images: string[];
  features: string[];
  description: string;
  sellerEmail: string;
  engine: string;
  transmission: string;
  fuelType: string;
  fuelEfficiency: string;
  exteriorColor: string;
  interiorColor: string;
  status: 'published' | 'unpublished' | 'sold';
  isFeatured: boolean;
  views?: number;
  inquiriesCount?: number;
  isFlagged?: boolean;
  averageRating?: number;
  ratingCount?: number;
}

export interface User {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: 'seller' | 'customer' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string; // ISO String
  // Seller-specific profile info
  dealershipName?: string;
  bio?: string;
  logoUrl?: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'seller' | 'system';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  vehicleId: number;
  vehicleName: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  isReadBySeller: boolean;
  isReadByCustomer: boolean;
  isFlagged?: boolean;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export enum View {
  USED_CARS = 'USED_CARS',
  DETAIL = 'DETAIL',
  SELLER_DASHBOARD = 'SELLER_DASHBOARD',
  ADMIN_PANEL = 'ADMIN_PANEL',
  LOGIN_PORTAL = 'LOGIN_PORTAL',
  CUSTOMER_LOGIN = 'CUSTOMER_LOGIN',
  SELLER_LOGIN = 'SELLER_LOGIN',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  COMPARISON = 'COMPARISON',
  WISHLIST = 'WISHLIST',
  PROFILE = 'PROFILE',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  INBOX = 'INBOX',
}

export interface ProsAndCons {
    pros: string[];
    cons: string[];
}

export interface SearchFilters {
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    features?: string[];
}

export interface PlatformSettings {
    listingFee: number;
    siteAnnouncement: string;
}

export interface AuditLogEntry {
    id: number;
    timestamp: string; // ISO String
    actor: string; // email of the admin
    action: string;
    target: string; // e.g., user email or vehicle ID
    details?: string;
}