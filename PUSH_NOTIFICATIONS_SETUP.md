# 🔔 Push Notifications Setup Guide

Complete guide to set up push notifications that work even when the app is closed or phone is off.

## Overview

Push notifications will be sent automatically when:
- New appointment is created
- Appointment is cancelled
- Appointment is confirmed
- New message/update from salon

## Step 1: Install Dependencies

```powershell
npx expo install expo-notifications expo-device expo-constants
```

## Step 2: Download google-services.json (Android)

1. Go to Firebase Console: https://console.firebase.google.com/project/david-salon-fff6d/settings/general
2. Scroll to "Your apps" section
3. Click on the Android app (or add one if not exists)
4. Download `google-services.json`
5. Place it in project root: `david-salon-mobile-v2/google-services.json`

## Step 3: Download GoogleService-Info.plist (iOS)

1. Same Firebase Console page
2. Click on the iOS app (or add one if not exists)
3. Download `GoogleService-Info.plist`
4. Place it in project root: `david-salon-mobile-v2/GoogleService-Info.plist`

## Step 4: Update App.tsx to Register for Push Notifications

Add this to your `App.tsx` (or main app file):

```typescript
import { useEffect } from 'react';
import { 
  registerForPushNotificationsAsync, 
  savePushTokenToUser,
  setupNotificationListeners 
} from './src/services/pushNotifications';
import { useAuth } from './src/hooks/redux';

function App() {
  const { user } = useAuth();

  // Register for push notifications when user logs in
  useEffect(() => {
    if (user?.id) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          savePushTokenToUser(user.id, token);
        }
      });

      // Setup notification listeners
      const cleanup = setupNotificationListeners(
        (notification) => {
          // Handle notification received while app is open
          console.log('Notification received:', notification);
        },
        (response) => {
          // Handle notification tap
          console.log('Notification tapped:', response);
          // Navigate to appropriate screen based on notification data
          // navigation.navigate(response.notification.request.content.data.screen);
        }
      );

      return cleanup;
    }
  }, [user?.id]);

  // ... rest of your app
}
```

## Step 5: Deploy Cloud Functions

```powershell
firebase deploy --only functions
```

This deploys:
- `sendPushNotificationOnCreate` - Automatically sends push when notification is created
- `sendPushNotification` - Manual push notification sender
- `sendBatchPushNotifications` - Send to multiple users at once

## Step 6: Update Firestore Rules (Already Done ✅)

The rules already allow authenticated users to create notifications.

## Step 7: Test Push Notifications

### Test 1: Local Notification (Testing Only)

Add a button in your app:

```typescript
import { scheduleLocalNotification } from './src/services/pushNotifications';

<Button 
  title="Test Notification" 
  onPress={() => scheduleLocalNotification('Test', 'This is a test notification', 5)}
/>
```

### Test 2: Create a Notification in Firestore

```typescript
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from './src/config/firebase';

// This will trigger the Cloud Function to send push notification
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: 'USER_ID_HERE',
  title: 'New Appointment',
  message: 'You have a new appointment for tomorrow at 10 AM',
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
});
```

### Test 3: Manual Push via Cloud Function

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendNotif = httpsCallable(functions, 'sendPushNotification');

await sendNotif({
  userId: 'USER_ID_HERE',
  title: 'Test Notification',
  body: 'This is a manual test notification',
  notificationData: { screen: 'Appointments' }
});
```

## How It Works

### 1. User Opens App
- App requests notification permissions
- Gets Expo Push Token
- Saves token to user's Firestore document

### 2. Notification is Created
- When you create a notification in Firestore
- Cloud Function `sendPushNotificationOnCreate` triggers automatically
- Function gets user's push token
- Sends push notification via Expo Push API

### 3. User Receives Notification
- **App closed**: Notification appears in system tray
- **App open**: Notification appears as banner
- **Phone locked**: Notification appears on lock screen
- **Phone off**: Notification queued, delivered when phone turns on

## Integration Examples

### Send Notification When Appointment is Created

```typescript
// In your appointment creation code
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Create appointment
const appointmentRef = await addDoc(collection(db, 'appointments'), {
  // ... appointment data
});

// Send notification to stylist
await addDoc(collection(db, 'notifications'), {
  recipientId: stylistId,
  title: 'New Appointment',
  message: `${clientName} booked an appointment for ${appointmentDate}`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentRef.id,
});
```

### Send Notification When Appointment is Cancelled

```typescript
await addDoc(collection(db, 'notifications'), {
  recipientId: stylistId,
  title: 'Appointment Cancelled',
  message: `${clientName} cancelled their appointment`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentId,
});
```

### Send Batch Notification to All Stylists

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendBatch = httpsCallable(functions, 'sendBatchPushNotifications');

await sendBatch({
  userIds: ['stylist1', 'stylist2', 'stylist3'],
  title: 'Salon Announcement',
  body: 'We will be closed tomorrow for maintenance',
  notificationData: { type: 'announcement' }
});
```

## Notification Channels (Android)

The app creates a default notification channel with:
- **Name**: default
- **Importance**: MAX (shows as heads-up notification)
- **Vibration**: Yes
- **Sound**: Yes
- **Color**: #160B53 (salon brand color)

## iOS Background Modes

Already configured in `app.json`:
```json
"ios": {
  "infoPlist": {
    "UIBackgroundModes": ["remote-notification"]
  }
}
```

## Permissions

### Android
- `RECEIVE_BOOT_COMPLETED` - Receive notifications after device reboot
- `VIBRATE` - Vibrate on notification
- `NOTIFICATIONS` - Show notifications

### iOS
- Automatically requests permission on first launch

## Testing Checklist

- [ ] Install dependencies
- [ ] Download google-services.json (Android)
- [ ] Download GoogleService-Info.plist (iOS)
- [ ] Update App.tsx with push notification code
- [ ] Deploy Cloud Functions
- [ ] Test local notification
- [ ] Test creating notification in Firestore
- [ ] Test with app closed
- [ ] Test with phone locked
- [ ] Test notification tap navigation

## Troubleshooting

### "Must use physical device for Push Notifications"
**Solution**: Push notifications don't work in iOS Simulator. Use a real device or Android emulator.

### "Failed to get push token"
**Solution**: 
1. Check notification permissions are granted
2. Verify google-services.json is in project root
3. Rebuild the app: `npx expo run:android` or `npx expo run:ios`

### "Notification not received when app is closed"
**Solution**:
1. Verify Cloud Function is deployed: `firebase functions:list`
2. Check function logs: `firebase functions:log`
3. Verify user has expoPushToken in Firestore
4. Check Expo Push API status: https://status.expo.dev/

### "Invalid push token"
**Solution**: 
1. Delete and reinstall the app
2. Token will be regenerated on next login

## Production Considerations

### 1. Notification Scheduling
For appointment reminders, use Cloud Scheduler:
```javascript
// Schedule notification 1 hour before appointment
exports.sendAppointmentReminders = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    // Query appointments starting in 1 hour
    // Send reminder notifications
  });
```

### 2. Notification Badges
Update badge count when notifications are read:
```typescript
import * as Notifications from 'expo-notifications';

// Set badge count
await Notifications.setBadgeCountAsync(unreadCount);

// Clear badge
await Notifications.setBadgeCountAsync(0);
```

### 3. Rich Notifications
Add images and actions:
```javascript
{
  title: 'New Appointment',
  body: 'John Doe booked a haircut',
  data: { appointmentId: '123' },
  // iOS
  ios: {
    attachments: [{
      url: 'https://example.com/image.jpg'
    }]
  },
  // Android
  android: {
    channelId: 'appointments',
    largeIcon: 'https://example.com/icon.jpg',
    actions: [
      { title: 'Accept', pressAction: { id: 'accept' } },
      { title: 'Decline', pressAction: { id: 'decline' } }
    ]
  }
}
```

## Cost Estimate

### Expo Push Notifications
- **Free**: Unlimited push notifications
- No cost for using Expo Push API

### Firebase Cloud Functions
- **Free tier**: 2M invocations/month
- **Estimated usage**: ~1000 notifications/day = 30K/month
- **Cost**: $0 (well within free tier)

## Summary

✅ **Setup Complete When:**
1. Dependencies installed
2. Firebase config files downloaded
3. App.tsx updated with push notification code
4. Cloud Functions deployed
5. Tested on physical device

✅ **Notifications Will Work:**
- When app is closed
- When phone is locked
- When phone is off (delivered when turned on)
- On both iOS and Android

🚀 **Ready to implement!**
