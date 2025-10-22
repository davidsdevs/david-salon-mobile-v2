import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { FirestoreDocument, FirestoreListenerCallback } from '../types/firebase';
import { 
  loginWithFirebase,
  registerWithFirebase,
  logoutFromFirebase,
  resetPassword,
  updateUserProfile,
  changePassword,
  initializeAuth,
  clearError as clearAuthError,
  setUser,
  setToken
} from '../store/slices/firebaseAuthSlice';
import { LoginRequest, RegisterRequest, User } from '../types/api';

// Firebase Auth hooks
export const useFirebaseAuth = () => {
  const dispatch = useAppDispatch();
  const firebaseAuth = useAppSelector((state) => state.firebaseAuth);

  const login = useCallback((credentials: LoginRequest) => {
    return dispatch(loginWithFirebase(credentials));
  }, [dispatch]);

  const register = useCallback((userData: RegisterRequest) => {
    return dispatch(registerWithFirebase(userData));
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutFromFirebase());
  }, [dispatch]);

  const resetUserPassword = useCallback((email: string) => {
    return dispatch(resetPassword(email));
  }, [dispatch]);

  const updateProfile = useCallback((uid: string, updates: Partial<User>) => {
    return dispatch(updateUserProfile({ uid, updates }));
  }, [dispatch]);

  const changeUserPassword = useCallback((currentPassword: string, newPassword: string) => {
    return dispatch(changePassword({ currentPassword, newPassword }));
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const initialize = useCallback(() => {
    return dispatch(initializeAuth());
  }, [dispatch]);

  // Initialize auth on mount
  useEffect(() => {
    if (!firebaseAuth.isInitialized) {
      initialize();
    }
  }, [initialize, firebaseAuth.isInitialized]);

  return {
    ...firebaseAuth,
    login,
    register,
    logout,
    resetPassword: resetUserPassword,
    updateProfile,
    changePassword: changeUserPassword,
    clearError,
    initialize,
  };
};

// Firebase Storage hooks
export const useFirebaseStorage = () => {
  const uploadFile = useCallback(async (
    path: string,
    file: Blob | Uint8Array | ArrayBuffer,
    options?: {
      contentType?: string;
      customMetadata?: Record<string, string>;
      cacheControl?: string;
    }
  ) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.uploadFile(path, file, options);
  }, []);

  const deleteFile = useCallback(async (path: string) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.deleteFile(path);
  }, []);

  return {
    uploadFile,
    deleteFile,
  };
};

// Firebase Firestore hooks
export const useFirebaseFirestore = () => {
  const createDocument = useCallback(async <T>(
    collectionName: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.create(collectionName, data);
  }, []);

  const getDocument = useCallback(async <T extends FirestoreDocument>(
    collectionName: string,
    id: string
  ) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.getById<T>(collectionName, id);
  }, []);

  const updateDocument = useCallback(async <T>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.update(collectionName, id, data);
  }, []);

  const deleteDocument = useCallback(async (
    collectionName: string,
    id: string
  ) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.delete(collectionName, id);
  }, []);

  const queryDocuments = useCallback(async <T extends FirestoreDocument>(
    collectionName: string,
    options?: {
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
  ) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.query<T>(collectionName, options);
  }, []);

  const listenToCollection = useCallback(async <T extends FirestoreDocument>(
    collectionName: string,
    callback: (data: T[], error?: Error) => void,
    options?: {
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
    },
    listenerOptions?: {
      includeMetadataChanges?: boolean;
      source?: 'default' | 'server' | 'cache';
    }
  ) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.listenToCollection(
      collectionName,
      callback as FirestoreListenerCallback<FirestoreDocument>,
      options,
      listenerOptions
    );
  }, []);

  const listenToDocument = useCallback(async <T extends FirestoreDocument>(
    collectionName: string,
    id: string,
    callback: (data: T | null, error?: Error) => void,
    listenerOptions?: {
      includeMetadataChanges?: boolean;
      source?: 'default' | 'server' | 'cache';
    }
  ) => {
    const { firebaseService } = await import('../services/firebaseService');
    return firebaseService.listenToDocument(
      collectionName,
      id,
      callback as (data: FirestoreDocument | null, error?: Error) => void,
      listenerOptions
    );
  }, []);

  return {
    createDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    queryDocuments,
    listenToCollection,
    listenToDocument,
  };
};

// Combined Firebase hooks
export const useFirebase = () => {
  const auth = useFirebaseAuth();
  const storage = useFirebaseStorage();
  const firestore = useFirebaseFirestore();

  return {
    auth,
    storage,
    firestore,
  };
};
