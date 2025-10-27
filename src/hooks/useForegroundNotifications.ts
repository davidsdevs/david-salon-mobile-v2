import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNotification } from '../context/NotificationContext';

/**
 * Hook to handle push notifications when app is in foreground
 * Shows both system notifications (banner/tray) and in-app notification UI
 * System notifications are handled by the notification handler in pushNotifications.ts
 */
export function useForegroundNotifications() {
  const { showNotification } = useNotification();
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    // Skip in Expo Go
    if (isExpoGo) {
      console.log('⚠️ Foreground notifications not available in Expo Go');
      return;
    }

    // Listen for notifications received while app is in foreground
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Foreground notification received:', notification);

      const { title, body, data } = notification.request.content;

      // Determine notification type based on data
      let type: 'success' | 'error' | 'info' | 'warning' = 'info';
      
      if (data && typeof data === 'object') {
        const notifType = (data as any).type || '';
        
        // Map notification types to UI types
        if (notifType.includes('confirmed') || notifType.includes('approved') || notifType.includes('completed')) {
          type = 'success';
        } else if (notifType.includes('cancelled') || notifType.includes('rejected') || notifType.includes('failed')) {
          type = 'error';
        } else if (notifType.includes('warning') || notifType.includes('expiring') || notifType.includes('reminder')) {
          type = 'warning';
        } else {
          type = 'info';
        }
      }

      // Show in-app notification
      showNotification({
        title: title || 'Notification',
        message: body || 'You have a new notification',
        type,
        duration: 5000, // Show for 5 seconds
      });
    });

    return () => {
      subscription.remove();
    };
  }, [showNotification, isExpoGo]);
}
