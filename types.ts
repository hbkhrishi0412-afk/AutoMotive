import React from 'react';

// Vehicle Category Enum
export enum VehicleCategory {
  CAR = 'car',
  BIKE = 'bike',
  TRUCK = 'truck',
  BUS = 'bus',
  VAN = 'van',
  SUV = 'suv',
  HATCHBACK = 'hatchback',
  SEDAN = 'sedan',
  COUPE = 'coupe',
  CONVERTIBLE = 'convertible',
  WAGON = 'wagon',
  PICKUP = 'pickup'
}

// View Enum
export enum View {
  HOME = 'home',
  LOGIN = 'login',
  REGISTER = 'register',
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  VEHICLE_DETAIL = 'vehicleDetail',
  ADMIN = 'admin',
  CUSTOMER_LOGIN = 'customerLogin',
  ADMIN_LOGIN = 'adminLogin',
  SELLER_PROFILE = 'sellerProfile',
  PRICING = 'pricing',
  FAQ = 'faq',
  SUPPORT = 'support'
}

// User Interface
export interface User {
  _id?: string;
  email: string;
  name: string;
  password?: string;
  mobile: string;
  role: 'customer' | 'seller' | 'admin';
  status: 'active' | 'inactive';
  avatarUrl?: string;
  isVerified: boolean;
  dealershipName?: string;
  bio?: string;
  logoUrl?: string;
  subscriptionPlan: 'free' | 'pro' | 'premium';
  featuredCredits: number;
  usedCertifications: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Vehicle Interface
export interface Vehicle {
  _id?: string;
  id: number;
  category: VehicleCategory;
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  mileage: number;
  images: string[];
  features: string[];
  description?: string;
  sellerEmail: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  fuelEfficiency?: string;
  color?: string;
  status: 'published' | 'unpublished' | 'sold';
  isFeatured: boolean;
  views: number;
  inquiriesCount: number;
  isFlagged?: boolean;
  flagReason?: string;
  flaggedAt?: string;
  registrationYear?: number;
  insuranceValidity?: string;
  insuranceType?: string;
  rto?: string;
  city?: string;
  state?: string;
  noOfOwners?: number;
  displacement?: string;
  groundClearance?: string;
  bootSpace?: string;
  qualityReport?: any;
  certifiedInspection?: CertifiedInspection;
  certificationStatus: 'none' | 'requested' | 'approved' | 'rejected';
  videoUrl?: string;
  serviceRecords?: ServiceRecord[];
  accidentHistory?: AccidentRecord[];
  documents?: VehicleDocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Vehicle Document Interface
export interface VehicleDocument {
  type: string;
  url: string;
  name: string;
  uploadedAt: Date;
}

// Service Record Interface
export interface ServiceRecord {
  date: Date;
  serviceCenter: string;
  serviceType: string;
  cost: number;
  mileage: number;
  description?: string;
}

// Accident Record Interface
export interface AccidentRecord {
  date: Date;
  description: string;
  severity: 'minor' | 'major' | 'total';
  cost?: number;
  location?: string;
}

// Certified Inspection Interface
export interface CertifiedInspection {
  inspectionId: string;
  inspectorName: string;
  inspectionDate: Date;
  overallRating: number;
  engineCondition: number;
  bodyCondition: number;
  interiorCondition: number;
  electricalCondition: number;
  suspensionCondition: number;
  brakeCondition: number;
  notes?: string;
  images: string[];
  validUntil: Date;
}

// Conversation Interface
export interface Conversation {
  _id?: string;
  participants: string[];
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Message Interface
export interface ChatMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  readAt?: Date;
  messageType: 'text' | 'image' | 'file';
  attachments?: string[];
}

// Toast Interface
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'inquiry' | 'system' | 'promotion';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Platform Settings Interface
export interface PlatformSettings {
  _id?: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  features: {
    enableChat: boolean;
    enableReviews: boolean;
    enableCertification: boolean;
    enableBulkUpload: boolean;
  };
  pricing: {
    featuredListingPrice: number;
    premiumListingPrice: number;
    certificationPrice: number;
  };
  updatedAt: Date;
}

// Audit Log Entry Interface
export interface AuditLogEntry {
  _id?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Vehicle Data Interface
export interface VehicleData {
  _id?: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  category: VehicleCategory;
  priceRange: {
    min: number;
    max: number;
  };
  specifications: {
    engine?: string;
    transmission?: string;
    fuelType?: string;
    mileage?: number;
    seatingCapacity?: number;
    bootSpace?: string;
    groundClearance?: string;
    displacement?: string;
  };
  features: string[];
  pros: string[];
  cons: string[];
  marketTrends: {
    demand: 'low' | 'medium' | 'high';
    priceStability: 'stable' | 'volatile' | 'declining';
    resaleValue: 'poor' | 'average' | 'good' | 'excellent';
  };
  createdAt: Date;
  updatedAt: Date;
}

// Badge Interface
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: {
    type: 'vehicles_sold' | 'vehicles_listed' | 'reviews_received' | 'years_active';
    threshold: number;
  };
  isEarned: boolean;
  earnedAt?: Date;
}

// Command Interface
export interface Command {
  id: string;
  name: string;
  description: string;
  action: () => void;
  shortcut?: string;
  category: string;
}

// Subscription Plan Interface
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'yearly';
  features: string[];
  maxListings: number;
  maxImages: number;
  prioritySupport: boolean;
  analytics: boolean;
  customBranding: boolean;
}

// Plan Details Interface
export interface PlanDetails {
  plan: SubscriptionPlan;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

// Support Ticket Interface
export interface SupportTicket {
  _id?: string;
  ticketId: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'feature_request';
  assignedTo?: string;
  replies: TicketReply[];
  createdAt: Date;
  updatedAt: Date;
}

// Ticket Reply Interface
export interface TicketReply {
  _id?: string;
  userId: string;
  message: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: Date;
}

// FAQ Item Interface
export interface FAQItem {
  _id?: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Search Filters Interface
export interface SearchFilters {
  category?: VehicleCategory;
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  fuelType?: string;
  transmission?: string;
  location?: string;
  features?: string[];
}

// Pros and Cons Interface
export interface ProsAndCons {
  pros: string[];
  cons: string[];
}

// Suggestion Interface
export interface Suggestion {
  type: 'vehicle' | 'feature' | 'price' | 'location';
  title: string;
  description: string;
  action?: () => void;
}