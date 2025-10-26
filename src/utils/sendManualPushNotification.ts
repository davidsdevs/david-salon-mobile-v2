import { doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { sendPushNotification } from '../services/pushNotifications';

/**
 * Manually send push notification to a user
 * Call this after creating a notification in Firestore
 * 
 * @param userId - The recipient's user ID
 * @param title - Notification title
 * @param body - Notification message
 * @param data - Optional data to pass with notification
 */
export async function sendManualPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    // Get user's push token from Firestore
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    
    if (!userDoc.exists()) {
      console.log('⚠️ User not found:', userId);
      return false;
    }

    const userData = userDoc.data();
    const expoPushToken = userData['expoPushToken'];

    if (!expoPushToken) {
      console.log('⚠️ User has no push token:', userId);
      return false;
    }

    // Send push notification
    await sendPushNotification(expoPushToken, title, body, data);
    console.log('✅ Push notification sent to:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error sending manual push notification:', error);
    return false;
  }
}
