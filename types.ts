export enum View {
  USED_CARS = 'USED_CARS',
  DETAIL = 'DETAIL',
  DEALER_DASHBOARD = 'DEALER_DASHBOARD',
  ADMIN_PANEL = 'ADMIN_PANEL',
  LOGIN_PORTAL = 'LOGIN_PORTAL',
  CUSTOMER_LOGIN = 'CUSTOMER_LOGIN',
  DEALER_LOGIN = 'DEALER_LOGIN',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  COMPARISON = 'COMPARISON',
  WISHLIST = 'WISHLIST',
  PROFILE = 'PROFILE',
}

export interface User {
  name: string;
  email: string;
  password: string; // In a real app, this would be hashed
  mobile: string;
  role: 'customer' | 'dealer' | 'admin';
  status: 'active' | 'inactive';
}

export interface ProsAndCons {
    pros: string[];
    cons: string[];
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Vehicle {
  id: number;
  make: string;
  variant: string;
  year: number;
  price: number;
  mileage: number;
  images: string[]; // Vehicle images, first is primary
  features: string[];
  description: string;
  dealerEmail: string; // To associate vehicle with a dealer
  // New detailed specs
  engine: string;
  transmission: string;
  fuelType: string;
  mpg: string; // e.g., "25 city / 35 hwy"
  exteriorColor: string;
  interiorColor: string;
  // Rating properties
  averageRating?: number;
  ratingCount?: number;
  // New management properties
  status: 'published' | 'unpublished';
  isFeatured: boolean;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai' | 'dealer';
  text: string;
  timestamp: string; // ISO string
}

export interface Conversation {
    id: string; // Format: `customerEmail-vehicleId`
    customerId: string;
    customerName: string;
    dealerId: string;
    vehicleId: number;
    vehicleName: string;
    messages: ChatMessage[];
    lastMessageAt: string; // ISO string for sorting
    isReadByDealer: boolean;
}