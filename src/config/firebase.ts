import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig } from './production';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

// Initialize Firebase Auth with AsyncStorage persistence
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  console.warn('Firebase Auth already initialized, using existing instance');
  auth = getAuth(app);
}

// Initialize Firestore and Storage
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Export auth and app
export { auth };
export default app;

// Firebase collection names
export const COLLECTIONS = {
  USERS: 'users',
  CLIENTS: 'clients',
  STYLISTS: 'stylists',
  APPOINTMENTS: 'appointments',
  SERVICES: 'services',
  BRANCHES: 'branches',
  PRODUCTS: 'products',
  NOTIFICATIONS: 'notifications',
  PORTFOLIO: 'portfolio',
  ANALYTICS: 'analytics',
} as const;

// Firebase storage paths
export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profile-images',
  PORTFOLIO_IMAGES: 'portfolio-images',
  PRODUCT_IMAGES: 'product-images',
  BRANCH_IMAGES: 'branch-images',
  DOCUMENTS: 'documents',
} as const;

// Firebase configuration validation
export const validateFirebaseConfig = (): boolean => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const isValid = requiredKeys.every(key => {
    const value = firebaseConfig[key as keyof typeof firebaseConfig];
    return value !== undefined && value !== '';
  });

  if (!isValid) {
    console.warn('⚠️ Firebase configuration appears incomplete.');
  }

  return isValid;
};

// Get current environment config
const config = getConfig();
export const FIREBASE_CONFIG = {
  ...firebaseConfig,
  environment: config.ENVIRONMENT,
  debug: config.DEBUG_MODE,
};
