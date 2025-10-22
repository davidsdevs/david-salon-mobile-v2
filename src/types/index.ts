// Navigation types
export type RootStackParamList = {
  Root: undefined;
  Onboarding: undefined;
  Login: undefined;
  LoginPage: undefined;
  Main: undefined;
  MainTabs: undefined;
  StylistTabs: undefined;
  Booking: undefined;
  Notifications: undefined;
  StylistNotifications: undefined;
  Settings: undefined;
  StylistProfile: undefined;
  StylistEditProfile: undefined;
  StylistChangePassword: undefined;
  StylistClientDetails: { client: any };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Appointments: undefined;
  Products: undefined;
  Rewards: undefined;
  Profile: undefined;
};

export type StylistTabParamList = {
  StylistDashboard: undefined;
  StylistAppointments: undefined;
  StylistClients: undefined;
  StylistSchedule: undefined;
  StylistPortfolio: undefined;
};

export type BookingStackParamList = {
  BranchSelection: undefined;
  DateTimeSelection: { branchId: number };
  ServiceStylistSelection: { 
    branchId: number; 
    selectedDate: string; 
    selectedTime: string; 
  };
  BookingSummary: { 
    branchId: number; 
    selectedDate: string; 
    selectedTime: string; 
    selectedServices: any[]; 
    selectedStylists: { [serviceId: number]: any }; 
  };
};

// Screen props
export interface ScreenProps {
  onLogout?: () => void;
  onNavigate?: (screen: string) => void;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  membershipLevel: 'Gold' | 'Platinum' | 'Silver';
  points: number;
  memberSince: string;
}

// Appointment types
export interface Appointment {
  id: number;
  service: string;
  stylist: string;
  date: string;
  time: string;
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

// Product types
export interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  image?: string;
}

// Reward types
export interface Reward {
  id: number;
  title: string;
  description: string;
  points: string;
  buttonText: string;
  buttonStyle: 'filled' | 'outline' | 'disabled';
  available: boolean;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  validUntil: string;
  discount: string;
  buttonText: string;
  buttonStyle: 'outline';
}
