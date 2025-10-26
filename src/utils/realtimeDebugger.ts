import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export class RealtimeDebugger {
  private static subscriptions: Map<string, () => void> = new Map();
  private static debugMode = true;

  static enableDebugMode() {
    this.debugMode = true;
    console.log('🔧 RealtimeDebugger: Debug mode enabled');
  }

  static disableDebugMode() {
    this.debugMode = false;
    console.log('🔧 RealtimeDebugger: Debug mode disabled');
  }

  static log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`🔧 RealtimeDebugger: ${message}`, data || '');
    }
  }

  static async testConnection() {
    this.log('Testing Firebase connection...');
    
    try {
      const testRef = collection(db, 'appointments');
      const testQuery = query(testRef, where('clientId', '==', 'test'));
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.log('❌ Connection test timed out');
          reject(new Error('Connection timeout'));
        }, 10000);

        const unsubscribe = onSnapshot(
          testQuery,
          (snapshot) => {
            clearTimeout(timeout);
            this.log('✅ Firebase connection successful');
            unsubscribe();
            resolve(true);
          },
          (error) => {
            clearTimeout(timeout);
            this.log('❌ Firebase connection failed:', error);
            unsubscribe();
            reject(error);
          }
        );
      });
    } catch (error) {
      this.log('❌ Firebase connection error:', error);
      throw error;
    }
  }

  static async testRealtimeSubscription(userId: string) {
    this.log(`Testing real-time subscription for user: ${userId}`);
    
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(appointmentsRef, where('clientId', '==', userId));
      
      return new Promise((resolve, reject) => {
        let updateCount = 0;
        const startTime = Date.now();
        
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            updateCount++;
            const elapsed = Date.now() - startTime;
            this.log(`📡 Real-time update #${updateCount} received:`, {
              docsCount: snapshot.docs.length,
              elapsed: `${elapsed}ms`,
              metadata: snapshot.metadata,
              fromCache: snapshot.metadata.fromCache,
              hasPendingWrites: snapshot.metadata.hasPendingWrites
            });

            // Resolve after first successful update
            if (updateCount === 1) {
              this.log('✅ Real-time subscription working correctly');
              unsubscribe();
              resolve({
                success: true,
                updateCount,
                elapsed
              });
            }
          },
          (error) => {
            this.log('❌ Real-time subscription error:', error);
            unsubscribe();
            reject(error);
          }
        );

        // Timeout after 15 seconds
        setTimeout(() => {
          this.log('⏰ Real-time test timed out');
          unsubscribe();
          resolve({
            success: false,
            updateCount,
            elapsed: Date.now() - startTime,
            error: 'Timeout'
          });
        }, 15000);
      });
    } catch (error) {
      this.log('❌ Real-time subscription test error:', error);
      throw error;
    }
  }

  static getNetworkStatus() {
    return {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connection: typeof navigator !== 'undefined' ? (navigator as any).connection || null : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    };
  }

  static async diagnoseRealtimeIssues(userId: string) {
    this.log('🔍 Starting real-time diagnosis...');
    
    const results = {
      connection: false,
      subscription: false,
      networkStatus: this.getNetworkStatus(),
      errors: [] as string[]
    };

    try {
      // Test 1: Basic connection
      this.log('Test 1: Testing Firebase connection...');
      await this.testConnection();
      results.connection = true;
      this.log('✅ Connection test passed');
    } catch (error) {
      results.errors.push(`Connection failed: ${error}`);
      this.log('❌ Connection test failed:', error);
    }

    try {
      // Test 2: Real-time subscription
      this.log('Test 2: Testing real-time subscription...');
      const subscriptionResult: any = await this.testRealtimeSubscription(userId);
      results.subscription = subscriptionResult.success;
      this.log('✅ Subscription test passed');
    } catch (error) {
      results.errors.push(`Subscription failed: ${error}`);
      this.log('❌ Subscription test failed:', error);
    }

    this.log('🔍 Diagnosis complete:', results);
    return results;
  }

  static cleanup() {
    this.log('🧹 Cleaning up all subscriptions...');
    this.subscriptions.forEach((unsubscribe, key) => {
      this.log(`Unsubscribing from: ${key}`);
      unsubscribe();
    });
    this.subscriptions.clear();
  }
}

export default RealtimeDebugger;
