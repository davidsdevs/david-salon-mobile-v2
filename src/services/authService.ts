import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../config/firebase';
import { FirestoreUser, FirestoreClient, FirestoreStylist } from '../types/firebase';
import { User, Client, Stylist, LoginRequest, RegisterRequest } from '../types/api';

class AuthService {
  // Authentication methods
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      // Get user data from Firestore
      const userData = await this.getUserData(firebaseUser.uid);
      if (!userData) {
        throw new Error('User data not found');
      }

      // Update last login
      await this.updateLastLogin(firebaseUser.uid);

      return {
        user: this.convertFirestoreUserToAPI(userData),
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  async register(userData: RegisterRequest): Promise<{ user: User; token: string }> {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      // Create user document in Firestore
      const firestoreUser: Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'> = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || '',
        userType: userData.userType,
        isActive: true,
        emailVerified: false,
      };

      const userDoc = await this.createUserDocument(firestoreUser, userData.userType);

      // Send email verification
      await sendEmailVerification(firebaseUser);

      return {
        user: this.convertFirestoreUserToAPI(userDoc),
        token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  async updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw this.handleAuthError(error);
    }
  }

  // User data methods
  async getUserData(uid: string): Promise<FirestoreUser | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return null;
      }

      return { id: userSnap.id, ...userSnap.data() } as FirestoreUser;
    } catch (error) {
      console.error('Get user data error:', error);
      throw error;
    }
  }

  async getClientData(uid: string): Promise<Client | null> {
    try {
      const clientRef = doc(db, COLLECTIONS.CLIENTS, uid);
      const clientSnap = await getDoc(clientRef);
      
      if (!clientSnap.exists()) {
        return null;
      }

      const clientData = { id: clientSnap.id, ...clientSnap.data() } as FirestoreClient;
      return this.convertFirestoreClientToAPI(clientData);
    } catch (error) {
      console.error('Get client data error:', error);
      throw error;
    }
  }

  async getStylistData(uid: string): Promise<Stylist | null> {
    try {
      const stylistRef = doc(db, COLLECTIONS.STYLISTS, uid);
      const stylistSnap = await getDoc(stylistRef);
      
      if (!stylistSnap.exists()) {
        return null;
      }

      const stylistData = { id: stylistSnap.id, ...stylistSnap.data() } as FirestoreStylist;
      return this.convertFirestoreStylistToAPI(stylistData);
    } catch (error) {
      console.error('Get stylist data error:', error);
      throw error;
    }
  }

  // Auth state listener
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // Helper methods
  private async createUserDocument(
    userData: Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>,
    userType: 'client' | 'stylist'
  ): Promise<FirestoreUser> {
    const userRef = doc(db, COLLECTIONS.USERS, auth.currentUser!.uid);
    
    const firestoreUser: FirestoreUser = {
      id: auth.currentUser!.uid,
      ...userData,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    };

    await setDoc(userRef, firestoreUser);

    // Create specific user type document
    if (userType === 'client') {
      await this.createClientDocument(firestoreUser);
    } else if (userType === 'stylist') {
      await this.createStylistDocument(firestoreUser);
    }

    return firestoreUser;
  }

  private async createClientDocument(user: FirestoreUser): Promise<void> {
    const clientRef = doc(db, COLLECTIONS.CLIENTS, user.id);
    const clientData: Omit<FirestoreClient, 'id' | 'createdAt' | 'updatedAt'> = {
      ...user,
      userType: 'client',
      membershipLevel: 'Bronze',
      memberSince: new Date() as any,
      totalVisits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
    };

    await setDoc(clientRef, clientData);
  }

  private async createStylistDocument(user: FirestoreUser): Promise<void> {
    const stylistRef = doc(db, COLLECTIONS.STYLISTS, user.id);
    const stylistData: Omit<FirestoreStylist, 'id' | 'createdAt' | 'updatedAt'> = {
      ...user,
      userType: 'stylist',
      employeeId: `EMP${Date.now()}`,
      specialization: [],
      experience: 0,
      rating: 0,
      totalClients: 0,
      totalEarnings: 0,
      isAvailable: true,
      workingHours: {},
      services: [],
      branchId: '', // Will be set by admin
      commissionRate: 0.5, // 50% default
    };

    await setDoc(stylistRef, stylistData);
  }

  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(userRef, {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Update last login error:', error);
    }
  }

  private convertFirestoreUserToAPI(user: FirestoreUser): User {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      profileImage: user.profileImage,
      userType: user.userType,
      isActive: user.isActive,
      createdAt: user.createdAt.toDate().toISOString(),
      updatedAt: user.updatedAt.toDate().toISOString(),
    };
  }

  private convertFirestoreClientToAPI(client: FirestoreClient): Client {
    return {
      ...this.convertFirestoreUserToAPI(client),
      userType: 'client',
      membershipLevel: client.membershipLevel,
      memberSince: client.memberSince.toDate().toISOString(),
      totalVisits: client.totalVisits,
      totalSpent: client.totalSpent,
      loyaltyPoints: client.loyaltyPoints,
      preferredStylist: client.preferredStylistId || '',
      emergencyContact: client.emergencyContact,
    };
  }

  private convertFirestoreStylistToAPI(stylist: FirestoreStylist): Stylist {
    return {
      ...this.convertFirestoreUserToAPI(stylist),
      userType: 'stylist',
      employeeId: stylist.employeeId,
      specialization: stylist.specialization,
      experience: stylist.experience,
      rating: stylist.rating,
      totalClients: stylist.totalClients,
      totalEarnings: stylist.totalEarnings,
      isAvailable: stylist.isAvailable,
      workingHours: stylist.workingHours,
      services: stylist.services,
      portfolio: stylist.portfolio,
    };
  }

  private handleAuthError(error: any): Error {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };

    const message = errorMessages[error.code] || error.message || 'An error occurred during authentication.';
    return new Error(message);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
