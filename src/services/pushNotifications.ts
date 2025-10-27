import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure how notifications are handled when app is in foreground
// Only set handler if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,     // Show system notification alert
      shouldShowBanner: true,     // Show banner notification (iOS)
      shouldShowList: true,       // Add to notification list/tray
      shouldPlaySound: true,      // Play notification sound
      shouldSetBadge: true,       // Update app badge count
    }),
  });
}

/**
 * Register for push notifications and get Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Skip notification registration in Expo Go
  if (isExpoGo) {
    console.log('⚠️ Push notifications are not available in Expo Go (SDK 53+). Use a development build instead.');
    return undefined;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#160B53',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    // Use device push token (FCM for Android, APNs for iOS)
    // This works without Expo account and is production-ready
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    token = deviceToken.data;
    
    console.log('📱 Device Push Token Type:', deviceToken.type);
    console.log('📱 Device Push Token:', token);
  } else {
    console.log('⚠️ Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Save push token to user's Firestore document
 */
export async function savePushTokenToUser(userId: string, token: string) {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      expoPushToken: token,
      pushTokenUpdatedAt: new Date(),
    });
    console.log('✅ Push token saved to user:', userId);
  } catch (error) {
    console.error('❌ Error saving push token:', error);
  }
}

/**
 * Send push notification to a specific user
 * Call this from Cloud Functions or your backend
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
    priority: 'high',
    channelId: 'default',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('✅ Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    throw error;
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Skip listeners in Expo Go
  if (isExpoGo) {
    console.log('⚠️ Notification listeners are not available in Expo Go (SDK 53+).');
    return () => {}; // Return empty cleanup function
  }

  // Listener for when notification is received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number = 5
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: { test: true },
      sound: true,
    },
    trigger: { seconds: seconds } as any,
  });
  console.log(`📅 Local notification scheduled in ${seconds} seconds`);
}
