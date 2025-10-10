import React from 'react';
import type { VehicleCategoryData } from './components/vehicleData';

export enum View {
  HOME = 'HOME',
  USED_CARS = 'USED_CARS',
  NEW_CARS = 'NEW_CARS',
  DEALER_PROFILES = 'DEALER_PROFILES',
  DETAIL = 'DETAIL',
  COMPARISON = 'COMPARISON',
  WISHLIST = 'WISHLIST',
  PROFILE = 'PROFILE',
  INBOX = 'INBOX',
  SELLER_DASHBOARD = 'SELLER_DASHBOARD',
  SELLER_PROFILE = 'SELLER_PROFILE',
  ADMIN_PANEL = 'ADMIN_PANEL',
  LOGIN_PORTAL = 'LOGIN_PORTAL',
  CUSTOMER_LOGIN = 'CUSTOMER_LOGIN',
  SELLER_LOGIN = 'SELLER_LOGIN',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  PRICING = 'PRICING',
  SUPPORT = 'SUPPORT',
  FAQ = 'FAQ'
}

export enum VehicleCategory {
  TWO_WHEELER = 'TWO_WHEELER',
  THREE_WHEELER = 'THREE_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER',
  COMMERCIAL = 'COMMERCIAL'
}

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface PlanDetails {
  id: string;
  name: string;
  price: number;
  listingLimit: number | 'unlimited';
  featuredCredits: number;
  freeCertifications: number;
  isMostPopular?: boolean;
  features: string[];
}

export interface User {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: 'customer' | 'seller' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  avatarUrl?: string;
  dealershipName?: string;
  bio?: string;
  logoUrl?: string;
  isVerified?: boolean;
  subscriptionPlan?: SubscriptionPlan;
  featuredCredits?: number;
  usedCertifications?: number;
}

export interface Vehicle {
  id: number;
  category: VehicleCategory;
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  mileage: number;
  images: string[];
  videoUrl?: string;
  features: string[];
  description: string;
  sellerEmail: string;
  sellerName?: string;
  engine: string;
  transmission: string;
  fuelType: string;
  fuelEfficiency: string;
  color: string;
  status: 'published' | 'unpublished' | 'sold';
  isFeatured: boolean;
  views: number;
  inquiriesCount: number;
  isFlagged?: boolean;
  registrationYear: number;
  insuranceValidity: string;
  insuranceType: string;
  rto: string;
  city: string;
  state: string;
  noOfOwners: number;
  displacement: string;
  groundClearance: string;
  bootSpace: string;
  certificationStatus: 'none' | 'requested' | 'approved' | 'rejected';
  certifiedInspection?: CertifiedInspection;
  serviceRecords: ServiceRecord[];
  accidentHistory: AccidentRecord[];
  averageRating?: number;
  ratingCount?: number;
  sellerAverageRating?: number;
  sellerRatingCount?: number;
  sellerBadges?: Badge[];
}

export interface CertifiedInspection {
  reportId: string;
  summary: string;
  date: string;
  inspector: string;
  scores: Record<string, number>;
  details: Record<string, string>;
}

export interface ServiceRecord {
  date: string;
  service: string;
  mileage: number;
  location: string;
}

export interface AccidentRecord {
  date: string;
  description: string;
  severity: 'Minor' | 'Major' | 'Total Loss';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  vehicleId: number;
  vehicleName: string;
  vehiclePrice: number;
  messages: ChatMessage[];
  lastMessageAt: string;
  isReadBySeller: boolean;
  isReadByCustomer: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  flaggedAt?: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'seller' | 'system';
  text: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'offer' | 'image' | 'document';
  payload?: {
    offerPrice?: number;
    counterPrice?: number;
    status?: 'pending' | 'accepted' | 'rejected' | 'countered';
  };
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  siteAnnouncement?: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  maxListingsPerUser: number;
  featuredListingPrice: number;
  certificationPrice: number;
  supportEmail: string;
  supportPhone: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  target: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VehicleData {
  makes: VehicleCategoryData[];
  categories: VehicleCategory[];
  features: string[];
  fuelTypes: string[];
  transmissions: string[];
  colors: string[];
  states: Array<{ name: string; code: string; cities: string[] }>;
}

export interface Notification {
  id: number;
  recipientEmail: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export interface SupportTicket {
  id: number;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt: string;
  updatedAt: string;
  replies: Array<{
    author: string;
    message: string;
    timestamp: string;
  }>;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  action: () => void;
  keywords: string[];
  category: string;
}

export interface SearchFilters {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
}

export interface ProsAndCons {
  pros: string[];
  cons: string[];
}

export interface Suggestion {
  text: string;
  confidence: number;
}