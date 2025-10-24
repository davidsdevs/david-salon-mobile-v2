import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface NotificationData {
  recipientId: string;
  recipientRole?: 'client' | 'stylist';
  type: 'appointment_cancelled' | 'appointment_confirmed' | 'appointment_rescheduled' | 'appointment_reminder' | 'appointment_created' | 'general';
  title: string;
  message: string;
  data?: any;
  isRead?: boolean;
}

export class NotificationService {
  private static readonly COLLECTION_NAME = 'notifications';

  // Create a notification
  static async createNotification(notificationData: NotificationData): Promise<string> {
    try {
      console.log('📬 Creating notification:', notificationData);
      
      const notificationsRef = collection(db, this.COLLECTION_NAME);
      const docRef = await addDoc(notificationsRef, {
        ...notificationData,
        isRead: notificationData.isRead || false,
        createdAt: Timestamp.now(),
        readAt: null,
      });
      
      console.log('✅ Notification created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching notifications for user:', userId);
      
      const notificationsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        notificationsRef,
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate().toISOString(),
        readAt: doc.data()['readAt']?.toDate().toISOString() || null,
      }));
      
      console.log('✅ Found', notifications.length, 'notifications');
      return notifications;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: Timestamp.now(),
      });
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        notificationsRef,
        where('recipientId', '==', userId),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          isRead: true,
          readAt: Timestamp.now(),
        })
      );
      
      await Promise.all(updatePromises);
      console.log('✅ All notifications marked as read for user:', userId);
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete a notification
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.COLLECTION_NAME, notificationId);
      await deleteDoc(notificationRef);
      console.log('✅ Notification deleted:', notificationId);
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // Subscribe to real-time notifications for a user
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: any[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time notification subscription for user:', userId);
    
    const notificationsRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      console.log('📡 Real-time notification snapshot received:', snapshot.docs.length, 'notifications');
      
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate().toISOString(),
        readAt: doc.data()['readAt']?.toDate().toISOString() || null,
      }));
      
      callback(notifications);
    }, (error) => {
      console.error('❌ Error in notification subscription:', error);
    });
  }

  // Create appointment cancellation notification for stylist
  static async notifyStylistOfCancellation(
    stylistId: string,
    clientName: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<void> {
    try {
      await this.createNotification({
        recipientId: stylistId,
        recipientRole: 'stylist',
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `${clientName} has cancelled their ${serviceName} appointment on ${appointmentDate} at ${appointmentTime}.`,
        data: {
          clientName,
          appointmentDate,
          appointmentTime,
          serviceName,
        },
      });
      console.log('✅ Stylist notified of cancellation');
    } catch (error) {
      console.error('❌ Error notifying stylist of cancellation:', error);
      throw error;
    }
  }
}
