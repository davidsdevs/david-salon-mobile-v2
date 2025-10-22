import { Timestamp, DocumentReference, GeoPoint } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

// Firebase-specific types
export type FirebaseTimestamp = Timestamp;
export type FirebaseDocumentRef<T> = DocumentReference<T>;
export type FirebaseGeoPoint = GeoPoint;

// Base document interface for Firestore
export interface FirestoreDocument {
  id: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  createdBy?: string;
  updatedBy?: string;
}

// Firebase User with additional fields
export interface FirebaseUserProfile extends FirebaseUser {
  customClaims?: {
    userType?: 'client' | 'stylist' | 'admin';
    branchId?: string;
    permissions?: string[];
  };
}

// Firestore collection interfaces
export interface FirestoreUser extends FirestoreDocument {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  userType: 'client' | 'stylist' | 'admin';
  roles: string[];
  branchId?: string | null;
  isActive: boolean;
  lastLoginAt?: FirebaseTimestamp;
  emailVerified: boolean;
}

export interface FirestoreClient extends FirestoreUser {
  userType: 'client';
  membershipLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  memberSince?: FirebaseTimestamp;
  totalVisits?: number;
  totalSpent?: number;
  loyaltyPoints?: number;
  preferredStylistId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface FirestoreStylist extends FirestoreUser {
  userType: 'stylist';
  employeeId: string;
  specialization: string[];
  experience: number; // years
  rating: number;
  totalClients: number;
  totalEarnings: number;
  isAvailable: boolean;
  workingHours: {
    [key: string]: { // day of week (0-6)
      start: string; // HH:mm format
      end: string; // HH:mm format
      isOpen: boolean;
    };
  };
  services: string[];
  portfolio?: string[]; // array of portfolio item IDs
  branchId: string;
  commissionRate: number; // percentage
}

export interface FirestoreAppointment extends FirestoreDocument {
  clientId: string;
  stylistId: string;
  serviceId: string;
  branchId: string;
  date: FirebaseTimestamp;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // minutes
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  clientNotes?: string;
  stylistNotes?: string;
  price: number;
  discount?: number;
  finalPrice: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'online';
  paymentId?: string;
  // Populated fields (not stored in Firestore)
  client?: FirestoreClient;
  stylist?: FirestoreStylist;
  service?: FirestoreService;
  branch?: FirestoreBranch;
}

export interface FirestoreService extends FirestoreDocument {
  name: string;
  description: string;
  categoryId: string;
  duration: number; // minutes
  price: number;
  isActive: boolean;
  requiresStylist: boolean;
  maxConcurrent: number;
  requirements?: string[];
  images?: string[]; // array of image URLs
  tags?: string[];
}

export interface FirestoreServiceCategory extends FirestoreDocument {
  name: string;
  description: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  parentId?: string; // for subcategories
  sortOrder: number;
}

export interface FirestoreBranch extends FirestoreDocument {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: FirebaseGeoPoint;
  };
  phone: string;
  email: string;
  workingHours: {
    [key: string]: { // day of week (0-6)
      start: string; // HH:mm format
      end: string; // HH:mm format
      isOpen: boolean;
    };
  };
  isActive: boolean;
  managerId: string;
  images?: string[]; // array of image URLs
  amenities?: string[];
  capacity: number;
}

export interface FirestoreProduct extends FirestoreDocument {
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  price: number;
  cost: number;
  sku: string;
  barcode?: string;
  stock: number;
  minStock: number;
  maxStock: number;
  isActive: boolean;
  images: string[]; // array of image URLs
  specifications?: Record<string, any>;
  tags?: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
}

export interface FirestoreProductCategory extends FirestoreDocument {
  name: string;
  description: string;
  parentId?: string;
  isActive: boolean;
  image?: string;
  sortOrder: number;
}

export interface FirestorePortfolioItem extends FirestoreDocument {
  stylistId: string;
  title: string;
  description: string;
  images: string[]; // array of image URLs
  services: string[]; // array of service IDs
  clientId?: string; // if it's a client's work
  isPublic: boolean;
  isFeatured: boolean;
  tags: string[];
  likes: number;
  views: number;
}

export interface FirestoreNotification extends FirestoreDocument {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'promotion';
  isRead: boolean;
  data?: Record<string, any>;
  scheduledFor?: FirebaseTimestamp;
  readAt?: FirebaseTimestamp;
  actionUrl?: string;
  actionText?: string;
}

export interface FirestoreAnalytics extends FirestoreDocument {
  type: 'appointment' | 'revenue' | 'user' | 'service' | 'product';
  date: FirebaseTimestamp;
  metrics: Record<string, number>;
  dimensions?: Record<string, string>;
  branchId?: string;
  stylistId?: string;
}

// Query types
export interface FirestoreQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
    value: any;
  }>;
  startAfter?: any;
  endBefore?: any;
}

// Batch operations
export interface FirestoreBatchOperation {
  type: 'set' | 'update' | 'delete';
  ref: string; // document path
  data?: any;
}

// Transaction operations
export interface FirestoreTransactionOperation {
  type: 'get' | 'set' | 'update' | 'delete';
  ref: string; // document path
  data?: any;
}

// Real-time listener types
export interface FirestoreListenerOptions {
  includeMetadataChanges?: boolean;
  source?: 'default' | 'server' | 'cache';
}

export type FirestoreListenerCallback<T> = (data: T[], error?: Error) => void;

// Storage types
export interface FirebaseStorageFile {
  name: string;
  url: string;
  path: string;
  size: number;
  contentType: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export interface FirebaseUploadOptions {
  contentType?: string;
  customMetadata?: Record<string, string>;
  cacheControl?: string;
}

// Error types
export interface FirebaseError extends Error {
  code: string;
  message: string;
  details?: any;
}

// Auth types
export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  customClaims?: Record<string, any>;
}

// Collection references type
export type FirestoreCollection<T> = {
  [K in keyof T]: T[K] extends FirestoreDocument ? T[K] : never;
};
