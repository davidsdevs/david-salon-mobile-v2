# How to Add a Test Notification

## Option 1: Add Directly in Firebase Console (Easiest)

1. **Go to Firebase Console:**
   - Open https://console.firebase.google.com/
   - Select your project: `david-salon-fff6d`

2. **Navigate to Firestore:**
   - Click on "Firestore Database" in the left sidebar
   - Click on "Data" tab

3. **Add a Test Notification:**
   - Click "Start collection" or find the `notifications` collection
   - Click "Add document"
   - Use auto-generated ID or enter a custom ID
   - Add these fields:

```
Field Name          | Type      | Value
--------------------|-----------|------------------------------------------
userId              | string    | 4gf5AOdy4HffVillOmLu68ABgrb2
type                | string    | appointment_cancelled
title               | string    | Test Notification
message             | string    | John Doe cancelled their Haircut appointment on Oct 23 at 2:00 PM
isRead              | boolean   | false
createdAt           | timestamp | (click "Set to current time")
updatedAt           | timestamp | (click "Set to current time")
```

4. **Add nested data field:**
   - Click "Add field" under the document
   - Field name: `data`
   - Type: `map`
   - Add sub-fields:
     - `clientName` (string): "John Doe"
     - `appointmentDate` (string): "2025-10-23"
     - `appointmentTime` (string): "14:00"
     - `serviceName` (string): "Haircut"

5. **Save the document**

6. **Check your app:**
   - Open the app as a stylist
   - Go to Notifications screen
   - You should see the test notification!

---

## Option 2: Use the Test Button in Your App

Add this test button temporarily to your Stylist Dashboard:

### Step 1: Add this function to `StylistDashboardScreen.tsx`

```typescript
import { NotificationService } from '../../services/notificationService';

// Add this function inside your component
const createTestNotification = async () => {
  try {
    if (!user?.uid) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    await NotificationService.createNotification({
      userId: user.uid,
      type: 'appointment_cancelled',
      title: 'Test Notification',
      message: 'John Doe has cancelled their Haircut appointment on October 23, 2025 at 2:00 PM. This is a test notification.',
      data: {
        clientName: 'John Doe',
        appointmentDate: '2025-10-23',
        appointmentTime: '14:00',
        serviceName: 'Haircut',
      },
    });

    Alert.alert('Success', 'Test notification created! Check your notifications screen.');
  } catch (error) {
    console.error('Error creating test notification:', error);
    Alert.alert('Error', 'Failed to create test notification');
  }
};
```

### Step 2: Add a test button to your dashboard

```typescript
// Add this button somewhere in your render (temporarily for testing)
<TouchableOpacity
  style={{
    backgroundColor: '#160B53',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  }}
  onPress={createTestNotification}
>
  <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
    Create Test Notification
  </Text>
</TouchableOpacity>
```

### Step 3: Test it

1. Open your app as a stylist
2. Tap the "Create Test Notification" button
3. Go to Notifications screen
4. You should see the test notification!

---

## Option 3: Trigger Real Notification (Best Test)

The best way to test is to trigger a real notification:

### Test Cancellation Notification:

1. **As Client:**
   - Log in as a client
   - Book an appointment with a stylist
   - Go to "My Appointments"
   - Cancel the appointment

2. **As Stylist:**
   - Log in as the stylist
   - Check notifications screen
   - You should see a cancellation notification!
   - Check your email for the email notification
   - Check your device for push notification

---

## Verify Notification is Working

### Check 1: Firestore
- Go to Firebase Console > Firestore
- Look for `notifications` collection
- Verify the document exists with correct fields

### Check 2: App Logs
Look for these logs in your console:
```
🔔 Fetching notifications for user: [userId]
✅ Fetched X notifications
```

### Check 3: Notifications Screen
- Open app as stylist
- Tap on Notifications icon
- Should see notification(s) listed

### Check 4: Badge Count
- Unread notifications should show a badge count
- Badge should appear on notification icon

---

## Troubleshooting

### "No notifications found"
- Check that `userId` matches your logged-in user ID
- Verify Firestore index is enabled (should be done by now)
- Check Firebase Console to see if document exists

### "Error fetching notifications"
- Check console logs for specific error
- Verify Firestore rules allow read access
- Ensure index is built (check Indexes tab)

### Notification doesn't appear
- Pull to refresh the notifications screen
- Check that `createdAt` timestamp is set
- Verify `userId` field matches exactly

---

## Sample Notification Data Structure

```json
{
  "userId": "4gf5AOdy4HffVillOmLu68ABgrb2",
  "type": "appointment_cancelled",
  "title": "Appointment Cancelled",
  "message": "John Doe has cancelled their Haircut appointment on October 23, 2025 at 2:00 PM.",
  "data": {
    "clientName": "John Doe",
    "appointmentDate": "2025-10-23",
    "appointmentTime": "14:00",
    "serviceName": "Haircut"
  },
  "isRead": false,
  "createdAt": "2025-10-23T14:00:00.000Z",
  "updatedAt": "2025-10-23T14:00:00.000Z"
}
```

---

## Quick Test Checklist

- [ ] Firestore index is enabled
- [ ] Test notification added to Firestore
- [ ] User ID matches logged-in stylist
- [ ] App is running and logged in as stylist
- [ ] Notifications screen is accessible
- [ ] Console shows "Fetched X notifications"
- [ ] Notification appears in the list

---

## Next Steps After Testing

Once you confirm notifications are working:

1. ✅ Remove test button (if you added one)
2. ✅ Test real cancellation flow
3. ✅ Set up EmailJS for email notifications
4. ✅ Test push notifications on physical device
5. ✅ Add more notification types (reschedule, confirmation, etc.)

---

## Need Help?

If notifications still aren't showing:
1. Check console logs for errors
2. Verify Firestore rules allow reading notifications
3. Ensure the index is fully built (check Firebase Console > Indexes)
4. Try refreshing the app or restarting it

The notification system is ready - you just need to add a test notification to see it in action! 🎉
