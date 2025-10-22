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
      // Authenticate with Firebase
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth successful for:', firebaseUser.email);
      
      // Get user profile from Firestore by email (most reliable)
      let userProfile = await this.getUserProfileByEmail(credentials.email);
      
      // Fallback: try by UID if email search fails
      if (!userProfile) {
        console.log('⚠️ User not found by email, trying UID...');
        userProfile = await this.getUserProfile(firebaseUser.uid);
      }
      
      if (!userProfile) {
        throw new Error('User profile not found in database. Please contact support.');
      }
      
      console.log('✅ User profile loaded:', {
        email: userProfile.email,
        userType: userProfile.userType,
        roles: userProfile.roles
      });
      
      // Extract userType from roles array if not set
      if (!userProfile.userType && userProfile.roles && userProfile.roles.length > 0) {
        userProfile.userType = userProfile.roles[0] as any;
        console.log('📝 Set userType from roles:', userProfile.userType);
      }
      
      // Validate user can access mobile app
      const allowedRoles = ['client', 'stylist'];
      const isAllowed = 
        (userProfile.userType && allowedRoles.includes(userProfile.userType)) ||
        (userProfile.roles && userProfile.roles.some(r => allowedRoles.includes(r)));
      
      if (!isAllowed) {
        console.log('❌ Access denied for user type:', userProfile.userType);
        throw new Error('Access denied. Only clients and stylists can use this app.');
      }
      
      console.log('✅ Login successful as:', userProfile.userType);

      // Get Firebase ID token
      const token = await firebaseUser.getIdToken();
      const refreshToken = token;

      // Store user data if remember me is checked
      if (credentials.rememberMe) {
        await this.storeUserData(userProfile, token, refreshToken);
      }

      return {
        user: userProfile,
        token,
        refreshToken
      };
    } catch (error: any) {
      console.error('❌ Sign in error:', error.message);
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
        uid: firebaseUser.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: '',
        phone: userData.phone || '',
        address: '',
        profileImage: undefined,
        userType: userData.userType,
        roles: [userData.userType],
        branchId: null,
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
        // Remove branchId from userProfile to avoid null assignment issue
        const { branchId, ...userProfileWithoutBranch } = userProfile;
        
        const stylistData = {
          ...userProfileWithoutBranch,
          userType: 'stylist' as const,
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
   * Get user profile by email from Firestore
   */
  static async getUserProfileByEmail(email: string): Promise<User | null> {
    try {
      const collections = [COLLECTIONS.USERS, COLLECTIONS.CLIENTS, COLLECTIONS.STYLISTS];
      
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('email', '==', email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty && snapshot.docs[0]) {
          const userDoc = snapshot.docs[0];
          console.log(`✅ Found user in ${collectionName}:`, userDoc.id);
          return this.convertFirestoreDataToUser(userDoc.data(), userDoc.id);
        }
      }

      console.log('❌ User not found with email:', email);
      return null;
    } catch (error: any) {
      console.error('❌ Error searching by email:', error);
      return null;
    }
  }

  /**
   * Get user profile from Firestore
   * Searches by document ID first, then by uid field if not found
   */
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('🔄 getUserProfile: Starting for userId:', userId);
      console.log('🔄 getUserProfile: Checking collection:', COLLECTIONS.USERS);
      
      // Strategy 1: Try to get by document ID from users collection
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      console.log('🔄 getUserProfile: User doc exists (by ID):', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('🔄 getUserProfile: Found user by document ID:', { 
          id: userDoc.id,
          uid: userData['uid'],
          roles: userData['roles'],
          userType: userData['userType'],
          email: userData['email'],
          firstName: userData['firstName']
        });
        return this.convertFirestoreDataToUser(userData, userDoc.id);
      }

      // Strategy 2: Search by uid field in users collection
      console.log('🔄 getUserProfile: Searching by uid field in users collection...');
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('uid', '==', userId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty && usersSnapshot.docs[0]) {
        const foundUserDoc = usersSnapshot.docs[0];
        const userData = foundUserDoc.data();
        console.log('🔄 getUserProfile: Found user by uid field:', {
          docId: foundUserDoc.id,
          uid: userData['uid'],
          roles: userData['roles'],
          userType: userData['userType'],
          email: userData['email']
        });
        return this.convertFirestoreDataToUser(userData, foundUserDoc.id);
      }

      // Strategy 3: Try clients collection
      console.log('🔄 getUserProfile: Not found in users, trying clients...');
      const clientDoc = await getDoc(doc(db, COLLECTIONS.CLIENTS, userId));
      console.log('🔄 getUserProfile: Client doc exists:', clientDoc.exists());
      if (clientDoc.exists()) {
        const clientData = clientDoc.data();
        return this.convertFirestoreDataToUser(clientData, clientDoc.id) as Client;
      }

      // Strategy 4: Try stylists collection
      console.log('🔄 getUserProfile: Not found in clients, trying stylists...');
      const stylistDoc = await getDoc(doc(db, COLLECTIONS.STYLISTS, userId));
      console.log('🔄 getUserProfile: Stylist doc exists:', stylistDoc.exists());
      if (stylistDoc.exists()) {
        const stylistData = stylistDoc.data();
        return this.convertFirestoreDataToUser(stylistData, stylistDoc.id) as Stylist;
      }

      console.log('❌ getUserProfile: User not found in any collection with any strategy');
      return null;
    } catch (error: any) {
      console.error('❌ Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Convert Firestore data to User object, handling Timestamps
   */
  private static convertFirestoreDataToUser(data: any, id: string): User {
    // Convert Timestamps to ISO strings
    const convertTimestamps = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      
      if (typeof obj === 'object') {
        if (obj.seconds !== undefined) {
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
    
    const converted = convertTimestamps({ ...data });
    
    // Extract userType from roles if not present
    if (!converted.userType && converted.roles && Array.isArray(converted.roles) && converted.roles.length > 0) {
      converted.userType = converted.roles[0];
    }
    
    // Ensure roles array exists
    if (!converted.roles || !Array.isArray(converted.roles)) {
      converted.roles = converted.userType ? [converted.userType] : [];
    }
    
    // Map legacy fields
    if (converted.phoneNumber && !converted.phone) {
      converted.phone = converted.phoneNumber;
    }
    
    if (converted.firstName && converted.lastName && !converted.name) {
      converted.name = `${converted.firstName} ${converted.lastName}`;
    }
    
    return {
      id,
      ...converted,
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
