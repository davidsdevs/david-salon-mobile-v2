import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserData {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  address?: string;
  branchId?: string;
  roles?: string[];
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored user data on startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to load user from AsyncStorage:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as UserData;
          const merged = { ...userData, email: firebaseUser.email || '', uid: firebaseUser.uid };
          setUser(merged);
          await AsyncStorage.setItem('user', JSON.stringify(merged));
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
