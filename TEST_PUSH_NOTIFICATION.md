# 🧪 Test Push Notifications

## Quick Test Steps

### Step 1: Start the App

```powershell
npx expo start
```

Open on your **physical device** (push notifications don't work in iOS Simulator).

### Step 2: Add Test Button to Your App

Add this to any screen (e.g., StylistNotificationsScreen):

```typescript
import { scheduleLocalNotification } from '../../services/pushNotifications';
import { Button } from 'react-native';

// Add this button somewhere in your render
<Button 
  title="🔔 Test Local Notification (5 sec)" 
  onPress={() => scheduleLocalNotification(
    'Test Notification', 
    'This is a test push notification!', 
    5
  )}
/>
```

### Step 3: Test Local Notification

1. Tap the "Test Local Notification" button
2. Wait 5 seconds
3. You should see a notification appear!

### Step 4: Test Firestore Trigger (Real Push)

Create a notification in Firestore to trigger the Cloud Function:

```typescript
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';

// Add this button
<Button 
  title="🔥 Test Firestore Notification" 
  onPress={async () => {
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      recipientId: user.id, // Your user ID
      title: 'Test from Firestore',
      message: 'This notification was created in Firestore and triggered a push!',
      type: 'general',
      isRead: false,
      createdAt: Timestamp.now(),
    });
    alert('Notification created! Check your push notification.');
  }}
/>
```

### Step 5: Test with App Closed

1. Close the app completely (swipe away from recent apps)
2. Create a notification using Firebase Console or the test button
3. You should receive a push notification even with app closed!

## Testing Checklist

- [ ] App requests notification permissions on first launch
- [ ] Push token is saved to Firestore (check user document)
- [ ] Local notification works (5 second test)
- [ ] Firestore notification creates push (with app open)
- [ ] Push notification received with app closed
- [ ] Push notification received with phone locked
- [ ] Tapping notification opens the app
- [ ] Notification appears in notification center

## Check Push Token in Firestore

1. Go to Firebase Console: https://console.firebase.google.com/project/david-salon-fff6d/firestore
2. Open `users` collection
3. Find your user document
4. Check if `expoPushToken` field exists
5. Should look like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

## Troubleshooting

### "Must use physical device"
- Push notifications don't work in iOS Simulator
- Use a real iPhone or Android device/emulator

### No push token saved
- Check console logs for errors
- Verify notification permissions are granted
- Restart the app

### Notification not received
1. Check Cloud Function is deployed: `firebase functions:list`
2. Check function logs: `firebase functions:log`
3. Verify push token exists in user document
4. Check Expo Push API status: https://status.expo.dev/

### "Permission denied" error
- Make sure Firestore rules allow creating notifications
- Already fixed in previous deployment

## Manual Test via Firebase Console

1. Go to: https://console.firebase.google.com/project/david-salon-fff6d/firestore
2. Click on `notifications` collection
3. Click "Add document"
4. Fill in:
   ```
   recipientId: YOUR_USER_ID
   title: "Manual Test"
   message: "Testing push notification from console"
   type: "general"
   isRead: false
   createdAt: (current timestamp)
   ```
5. Click "Save"
6. Check your phone for push notification!

## Expected Behavior

### App Open:
- Notification appears as banner at top
- Console logs: "📬 Notification received"
- Notification added to notification list

### App Closed:
- Notification appears in system tray
- Sound plays
- Badge count increases
- Tapping opens app

### Phone Locked:
- Notification appears on lock screen
- Sound/vibration
- Can tap to unlock and open app

## Next: Deploy Cloud Functions

Once local testing works, deploy Cloud Functions:

```powershell
firebase deploy --only functions
```

This enables automatic push notifications when notifications are created!
