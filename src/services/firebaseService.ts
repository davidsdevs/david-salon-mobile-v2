import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, COLLECTIONS, STORAGE_PATHS, validateFirebaseConfig } from '../config/firebase';
import {
  FirestoreDocument,
  FirestoreQueryOptions,
  FirestoreBatchOperation,
  FirestoreTransactionOperation,
  FirebaseStorageFile,
  FirebaseUploadOptions,
  FirestoreListenerOptions,
  FirestoreListenerCallback,
} from '../types/firebase';

class FirebaseService {
  private isFirebaseConfigured(): boolean {
    return validateFirebaseConfig();
  }

  private handleFirebaseError(error: any, operation: string): never {
    if (!this.isFirebaseConfigured()) {
      console.warn(`⚠️ Firebase not configured. Skipping ${operation}.`);
      throw new Error(`Firebase not configured. Please set up your Firebase project.`);
    }
    console.error(`Error in ${operation}:`, error);
    throw error;
  }

  // Generic CRUD operations
  async create<T extends FirestoreDocument>(
    collectionName: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    try {
      if (!this.isFirebaseConfigured()) {
        throw new Error('Firebase not configured');
      }

      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Document was not created');
      }

      return { id: docRef.id, ...docSnap.data() } as T;
    } catch (error) {
      this.handleFirebaseError(error, 'create document');
    }
  }

  async getById<T extends FirestoreDocument>(
    collectionName: string,
    id: string
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  async update<T extends FirestoreDocument>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Query operations
  async query<T extends FirestoreDocument>(
    collectionName: string,
    options: FirestoreQueryOptions = {}
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const constraints: QueryConstraint[] = [];

      // Add where clauses
      if (options.where) {
        options.where.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      // Add ordering
      if (options.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Add limit
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      // Add pagination
      if (options.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }
      if (options.endBefore) {
        constraints.push(endBefore(options.endBefore));
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  // Real-time listeners
  listenToCollection<T extends FirestoreDocument>(
    collectionName: string,
    callback: FirestoreListenerCallback<T>,
    options: FirestoreQueryOptions = {},
    listenerOptions: FirestoreListenerOptions = {}
  ): Unsubscribe {
    try {
      const collectionRef = collection(db, collectionName);
      const constraints: QueryConstraint[] = [];

      // Add where clauses
      if (options.where) {
        options.where.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      // Add ordering
      if (options.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Add limit
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collectionRef, ...constraints);
      
      return onSnapshot(
        q,
        {
          ...listenerOptions,
          next: (querySnapshot: any) => {
            const data = querySnapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
            })) as T[];
            callback(data);
          },
          error: (error: any) => {
            console.error('Error in real-time listener:', error);
            callback([], error as Error | undefined);
          }
        }
      );
    } catch (error) {
      console.error('Error setting up listener:', error);
      callback([], error as Error | undefined);
      return () => {}; // Return empty unsubscribe function
    }
  }

  listenToDocument<T extends FirestoreDocument>(
    collectionName: string,
    id: string,
    callback: (data: T | null, error?: Error) => void,
    listenerOptions: FirestoreListenerOptions = {}
  ): Unsubscribe {
    try {
      const docRef = doc(db, collectionName, id);
      
      return onSnapshot(
        docRef,
        {
          ...listenerOptions,
          next: (docSnap: any) => {
            if (docSnap.exists()) {
              const data = { id: docSnap.id, ...docSnap.data() } as T;
              callback(data);
            } else {
              callback(null);
            }
          },
          error: (error: any) => {
            console.error('Error in document listener:', error);
            callback(null, error as Error | undefined);
          }
        }
      );
    } catch (error) {
      console.error('Error setting up document listener:', error);
      callback(null, error as Error | undefined);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Batch operations
  async batchWrite(operations: FirestoreBatchOperation[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(operation => {
        const docRef = doc(db, operation.ref);
        
        switch (operation.type) {
          case 'set':
            batch.set(docRef, {
              ...operation.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...operation.data,
              updatedAt: serverTimestamp(),
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error in batch write:', error);
      throw error;
    }
  }

  // Transaction operations
  async runTransaction<T>(
    operations: FirestoreTransactionOperation[],
    updateFunction: (transaction: any) => Promise<T>
  ): Promise<T> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Execute the custom update function
        const result = await updateFunction(transaction);
        
        // Execute additional operations if provided
        operations.forEach(operation => {
          const docRef = doc(db, operation.ref);
          
          switch (operation.type) {
            case 'get':
              transaction.get(docRef);
              break;
            case 'set':
              transaction.set(docRef, {
                ...operation.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              break;
            case 'update':
              transaction.update(docRef, {
                ...operation.data,
                updatedAt: serverTimestamp(),
              });
              break;
            case 'delete':
              transaction.delete(docRef);
              break;
          }
        });
        
        return result;
      });
    } catch (error) {
      console.error('Error in transaction:', error);
      throw error;
    }
  }

  // Storage operations
  async uploadFile(
    path: string,
    file: Blob | Uint8Array | ArrayBuffer,
    options: FirebaseUploadOptions = {}
  ): Promise<FirebaseStorageFile> {
    try {
      const storageRef = ref(storage, path);
      const uploadResult = await uploadBytes(storageRef, file, {
        contentType: options.contentType,
        customMetadata: options.customMetadata,
        cacheControl: options.cacheControl,
      });
      
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      return {
        name: uploadResult.ref.name,
        url: downloadURL,
        path: uploadResult.ref.fullPath,
        size: uploadResult.metadata.size,
        contentType: uploadResult.metadata.contentType || 'application/octet-stream',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Utility methods
  async exists(collectionName: string, id: string): Promise<boolean> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking document existence:', error);
      return false;
    }
  }

  async count(collectionName: string, whereClause?: any): Promise<number> {
    try {
      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef);
      
      if (whereClause) {
        q = query(collectionRef, where(whereClause.field, whereClause.operator, whereClause.value));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error counting documents:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;
