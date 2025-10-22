// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User & Authentication Types
export interface User {
  id: string;
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  address?: string;
  profileImage?: string | undefined;
  userType: 'client' | 'stylist' | 'admin';
  roles: string[];
  branchId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy properties for backward compatibility
  name?: string;
  membershipLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  memberSince?: string;
  points?: number;
}

export interface Client extends User {
  userType: 'client';
  membershipLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  memberSince?: string;
  totalVisits?: number;
  totalSpent?: number;
  loyaltyPoints?: number;
  preferredStylist?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  } | undefined;
}

export interface Stylist extends User {
  userType: 'stylist';
  employeeId: string;
  specialization: string[];
  experience: number; // years
  rating: number;
  totalClients: number;
  totalEarnings: number;
  isAvailable: boolean;
  branchId?: string;
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      isOpen: boolean;
    };
  };
  services: string[];
  portfolio?: string[] | undefined;
}

// Appointment Types
export interface Appointment {
  id: string;
  clientId: string;
  stylistId: string;
  serviceId: string;
  branchId: string;
  date: string; // ISO date
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
  createdAt: string;
  updatedAt: string;
  // Populated fields
  client?: Client;
  stylist?: Stylist;
  service?: Service;
  branch?: Branch;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  duration: number; // minutes
  price: number;
  isActive: boolean;
  requiresStylist: boolean;
  maxConcurrent: number;
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  isActive: boolean;
}

// Branch Types
export interface Branch {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      isOpen: boolean;
    };
  };
  isActive: boolean;
  managerId: string;
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  brand: string;
  price: number;
  cost: number;
  sku: string;
  barcode?: string;
  stock: number;
  minStock: number;
  maxStock: number;
  isActive: boolean;
  images: string[];
  specifications?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  isActive: boolean;
}

// Portfolio Types
export interface PortfolioItem {
  id: string;
  stylistId: string;
  title: string;
  description: string;
  images: string[];
  services: string[];
  clientId?: string; // if it's a client's work
  isPublic: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'promotion';
  isRead: boolean;
  data?: Record<string, any>;
  scheduledFor?: string;
  createdAt: string;
  readAt?: string;
}

// Analytics Types
export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  metrics: {
    totalAppointments: number;
    totalRevenue: number;
    totalClients: number;
    averageAppointmentValue: number;
    topServices: Array<{
      serviceId: string;
      serviceName: string;
      count: number;
      revenue: number;
    }>;
    topStylists: Array<{
      stylistId: string;
      stylistName: string;
      appointments: number;
      revenue: number;
    }>;
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  field: string;
  value: any;
  constraint: string;
}

// Request Types
export interface CreateAppointmentRequest {
  clientId: string;
  stylistId: string;
  serviceId: string;
  branchId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  stylistId?: string;
  serviceId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: Appointment['status'];
  notes?: string;
  clientNotes?: string;
  stylistNotes?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: 'client' | 'stylist';
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
  stylistId?: string;
  serviceId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
