import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../config/firebase';
import { User, Client, Stylist, LoginRequest, RegisterRequest } from '../types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export class FirebaseAuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(credentials: LoginRequest): Promise<AuthResult> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      
      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        throw new Error('User profile not found. Please contact support.');
      }
      
      // Check if user is allowed to login (only client and stylist)
      // First check roles array, then fallback to userType
      const userRoles = userProfile.roles;
      const userType = userProfile.userType;
      
      let hasValidRole = false;
      
      if (userRoles && Array.isArray(userRoles)) {
        // Check if user has client or stylist in roles array
        hasValidRole = userRoles.some(role => ['client', 'stylist'].includes(role));
        console.log('🔄 Checking roles array:', { roles: userRoles, hasValidRole });
      } else {
        // Fallback to userType check
        hasValidRole = ['client', 'stylist'].includes(userType);
        console.log('🔄 Checking userType (fallback):', { userType, hasValidRole });
      }
      
      if (!hasValidRole) {
        console.log('🔄 Login rejected - No valid role found:', { userType, roles: userRoles });
        throw new Error('Access denied. Only clients and stylists can use the mobile app.');
      }

      // Get Firebase ID token
      const token = await firebaseUser.getIdToken();
      
      // For mobile, we'll use the Firebase ID token as both token and refresh token
      // Firebase handles token refresh automatically
      const refreshToken = token;

      // Store user data in AsyncStorage if remember me is checked
      if (credentials.rememberMe) {
        await this.storeUserData(userProfile, token, refreshToken);
      }

      return {
        user: userProfile,
        token,
        refreshToken
      };
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Register a new user
   */
  static async register(userData: RegisterRequest): Promise<AuthResult> {
    try {
      // Create Firebase user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase user profile
      await updateProfile(firebaseUser, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // Create user profile in Firestore
      const userProfile: User = {
        id: firebaseUser.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || '',
        profileImage: undefined,
        userType: userData.userType,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Legacy properties
        name: `${userData.firstName} ${userData.lastName}`,
        memberSince: new Date().toISOString(),
        points: 0
      };

      // Add user-specific data based on type
      if (userData.userType === 'client') {
        const clientData: Client = {
          ...userProfile,
          userType: 'client',
          membershipLevel: 'Bronze',
          memberSince: new Date().toISOString(),
          totalVisits: 0,
          totalSpent: 0,
          loyaltyPoints: 0
        };
        await setDoc(doc(db, COLLECTIONS.CLIENTS, firebaseUser.uid), {
          ...clientData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (userData.userType === 'stylist') {
        const stylistData: Stylist = {
          ...userProfile,
          userType: 'stylist',
          employeeId: `EMP${Date.now()}`,
          specialization: [],
          experience: 0,
          rating: 0,
          totalClients: 0,
          totalEarnings: 0,
          isAvailable: true,
          workingHours: {
            monday: { start: '09:00', end: '18:00', isOpen: true },
            tuesday: { start: '09:00', end: '18:00', isOpen: true },
            wednesday: { start: '09:00', end: '18:00', isOpen: true },
            thursday: { start: '09:00', end: '18:00', isOpen: true },
            friday: { start: '09:00', end: '18:00', isOpen: true },
            saturday: { start: '09:00', end: '18:00', isOpen: true },
            sunday: { start: '10:00', end: '16:00', isOpen: false }
          },
          services: []
        };
        await setDoc(doc(db, COLLECTIONS.STYLISTS, firebaseUser.uid), {
          ...stylistData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Also store in general users collection
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Get Firebase ID token
      const token = await firebaseUser.getIdToken();
      const refreshToken = token;

      return {
        user: userProfile,
        token,
        refreshToken
      };
    } catch (error: any) {
      console.error('Firebase register error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await this.clearStoredUserData();
    } catch (error: any) {
      console.error('Firebase sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Firebase password reset error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('🔄 getUserProfile: Starting for userId:', userId);
      
      // First try to get from users collection
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      console.log('🔄 getUserProfile: User doc exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('🔄 getUserProfile: Raw user data from Firestore:', { 
          role: userData['role'], 
          userType: userData['userType'],
          email: userData['email'],
          phone: userData['phone'],
          phoneNumber: userData['phoneNumber'],
          firstName: userData['firstName'],
          lastName: userData['lastName']
        });
        return this.convertFirestoreDataToUser(userData, userDoc.id);
      }

      // If not found in users, try clients collection
      const clientDoc = await getDoc(doc(db, COLLECTIONS.CLIENTS, userId));
      if (clientDoc.exists()) {
        const clientData = clientDoc.data();
        return this.convertFirestoreDataToUser(clientData, clientDoc.id) as Client;
      }

      // If not found in clients, try stylists collection
      const stylistDoc = await getDoc(doc(db, COLLECTIONS.STYLISTS, userId));
      if (stylistDoc.exists()) {
        const stylistData = stylistDoc.data();
        return this.convertFirestoreDataToUser(stylistData, stylistDoc.id) as Stylist;
      }

      return null;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Convert Firestore data to User object, handling Timestamps
   */
  private static convertFirestoreDataToUser(data: any, id: string): User {
    const convertedData = { ...data };
    
    // Convert all Timestamp fields to ISO strings
    const convertTimestamps = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      
      if (typeof obj === 'object') {
        if (obj.type === 'firestore/timestamp/1.0' || obj.seconds !== undefined) {
          // This is a Firestore Timestamp
          return obj.toDate?.()?.toISOString() || new Date().toISOString();
        }
        
        if (Array.isArray(obj)) {
          return obj.map(convertTimestamps);
        }
        
        const converted: any = {};
        for (const key in obj) {
          converted[key] = convertTimestamps(obj[key]);
        }
        return converted;
      }
      
      return obj;
    };
    
    const converted = convertTimestamps(convertedData);
    
    // Map fields for compatibility with seed data structure
    console.log('🔄 convertFirestoreDataToUser: Original data:', { 
      role: converted.role, 
      roles: converted.roles,
      userType: converted.userType,
      email: converted.email 
    });
    
    // Handle roles array - if user has roles array, use it
    if (converted.roles && Array.isArray(converted.roles)) {
      console.log('🔄 User has roles array:', converted.roles);
      // Keep the roles array as is
    } else if (converted.role && !converted.userType) {
      console.log('🔄 Mapping role to userType:', converted.role, '→', converted.role);
      converted.userType = converted.role;
    } else if (converted.role && converted.userType && converted.role !== converted.userType) {
      // If both exist but are different, prioritize role field
      console.log('🔄 Role and userType differ, prioritizing role:', converted.role, 'over', converted.userType);
      converted.userType = converted.role;
    }
    
    // Note: We don't default invalid userTypes to client here
    // The validation will happen in the login process instead
    
    // Map phoneNumber to phone if needed
    if (converted.phoneNumber && !converted.phone) {
      converted.phone = converted.phoneNumber;
    }
    
    // Map firstName and lastName to name if needed
    if (converted.firstName && converted.lastName && !converted.name) {
      converted.name = `${converted.firstName} ${converted.lastName}`;
    }
    
    console.log('🔄 convertFirestoreDataToUser: Final data:', { 
      role: converted.role, 
      roles: converted.roles,
      userType: converted.userType,
      email: converted.email,
      phone: converted.phone,
      phoneNumber: converted.phoneNumber,
      firstName: converted.firstName,
      lastName: converted.lastName
    });
    
    return {
      id,
      uid: id, // Add uid field for compatibility
      ...converted,
      phone: converted.phone || converted.phoneNumber || '', // Explicitly include phone
      createdAt: converted.createdAt || new Date().toISOString(),
      updatedAt: converted.updatedAt || new Date().toISOString()
    } as User;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Also update in specific collection if it exists
      const userProfile = await this.getUserProfile(userId);
      if (userProfile) {
        if (userProfile.userType === 'client') {
          const clientRef = doc(db, COLLECTIONS.CLIENTS, userId);
          await updateDoc(clientRef, {
            ...updates,
            updatedAt: serverTimestamp()
          });
        } else if (userProfile.userType === 'stylist') {
          const stylistRef = doc(db, COLLECTIONS.STYLISTS, userId);
          await updateDoc(stylistRef, {
            ...updates,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Get current user from Firebase Auth
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Get Firebase ID token
   */
  static async getToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Store user data in AsyncStorage
   */
  private static async storeUserData(user: User, token: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(user)],
        ['authToken', token],
        ['refreshToken', refreshToken]
      ]);
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  /**
   * Clear stored user data from AsyncStorage
   */
  private static async clearStoredUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['user', 'authToken', 'refreshToken']);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return error.message || 'An error occurred. Please try again';
    }
  }
}

export default FirebaseAuthService;
