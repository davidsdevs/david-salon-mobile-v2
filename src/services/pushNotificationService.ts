import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
}

export class PushNotificationService {
  // Request permissions for push notifications
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push notification permissions');
        return null;
      }

      // Get the push notification token
      const projectId = Constants.expoConfig?.extra?.['eas']?.projectId;
      if (!projectId) {
        console.log('⚠️ No project ID found for push notifications');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('✅ Push notification token:', token);
      return token;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  // Send a local push notification
  static async sendLocalNotification(notificationData: PushNotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: true,
        },
        trigger: null, // Send immediately
      });
      console.log('✅ Local notification sent');
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  // Listen for notifications
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Listen for notification responses (when user taps on notification)
  static addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Send push notification for appointment cancellation
  static async notifyStylistOfCancellation(
    clientName: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<void> {
    await this.sendLocalNotification({
      title: 'Appointment Cancelled',
      body: `${clientName} has cancelled their ${serviceName} appointment on ${appointmentDate} at ${appointmentTime}.`,
      data: {
        type: 'appointment_cancelled',
        clientName,
        appointmentDate,
        appointmentTime,
        serviceName,
      },
    });
  }

  // Send push notification for new appointment
  static async notifyStylistOfNewAppointment(
    clientName: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<void> {
    await this.sendLocalNotification({
      title: 'New Appointment',
      body: `${clientName} has booked a ${serviceName} appointment on ${appointmentDate} at ${appointmentTime}.`,
      data: {
        type: 'appointment_new',
        clientName,
        appointmentDate,
        appointmentTime,
        serviceName,
      },
    });
  }

  // Send push notification for appointment confirmation
  static async notifyStylistOfConfirmation(
    clientName: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<void> {
    await this.sendLocalNotification({
      title: 'Appointment Confirmed',
      body: `${clientName}'s ${serviceName} appointment on ${appointmentDate} at ${appointmentTime} has been confirmed.`,
      data: {
        type: 'appointment_confirmed',
        clientName,
        appointmentDate,
        appointmentTime,
        serviceName,
      },
    });
  }

  // Send push notification for appointment reschedule
  static async notifyStylistOfReschedule(
    clientName: string,
    oldDate: string,
    oldTime: string,
    newDate: string,
    newTime: string,
    serviceName: string
  ): Promise<void> {
    await this.sendLocalNotification({
      title: 'Appointment Rescheduled',
      body: `${clientName} has rescheduled their ${serviceName} appointment from ${oldDate} at ${oldTime} to ${newDate} at ${newTime}.`,
      data: {
        type: 'appointment_rescheduled',
        clientName,
        oldDate,
        oldTime,
        newDate,
        newTime,
        serviceName,
      },
    });
  }

  // Save push token to user profile
  static async savePushToken(userId: string, pushToken: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: pushToken,
        pushTokenUpdatedAt: new Date().toISOString(),
      });
      console.log('✅ Push token saved to user profile:', userId);
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  }

  // Send remote push notification via Expo Push API
  static async sendRemotePushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data || {},
        priority: 'high',
        channelId: 'default',
      };

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
      if (result.data?.status === 'ok') {
        console.log('✅ Remote push notification sent successfully');
      } else {
        console.error('❌ Failed to send remote push notification:', result);
      }
    } catch (error) {
      console.error('❌ Error sending remote push notification:', error);
    }
  }
}
