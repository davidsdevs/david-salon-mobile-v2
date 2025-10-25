# 📲 Manual Push Notifications Guide (Free - No Cloud Functions)

Since you're on the free Spark plan, use manual push notifications instead of Cloud Functions.

## How It Works

1. User opens app → Gets push token → Saved to Firestore
2. You create notification in Firestore
3. **You manually call the push function** → Sends push notification
4. User receives notification!

## Usage Examples

### Example 1: Send Notification When Appointment is Created

```typescript
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { sendManualPushNotification } from '../utils/sendManualPushNotification';

// Create appointment
const appointmentRef = await addDoc(collection(db, 'appointments'), {
  clientId: clientId,
  stylistId: stylistId,
  date: appointmentDate,
  time: appointmentTime,
  services: selectedServices,
  status: 'pending',
  createdAt: Timestamp.now(),
});

// Create notification in Firestore
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: stylistId,
  title: 'New Appointment',
  message: `${clientName} booked an appointment for ${appointmentDate} at ${appointmentTime}`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentRef.id,
});

// Send push notification
await sendManualPushNotification(
  stylistId,
  'New Appointment',
  `${clientName} booked an appointment for ${appointmentDate} at ${appointmentTime}`,
  { 
    type: 'appointment',
    appointmentId: appointmentRef.id,
    screen: 'Appointments'
  }
);
```

### Example 2: Send Notification When Appointment is Cancelled

```typescript
import { sendManualPushNotification } from '../utils/sendManualPushNotification';

// Update appointment status
await updateDoc(doc(db, 'appointments', appointmentId), {
  status: 'cancelled',
  cancelledAt: Timestamp.now(),
});

// Create notification
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: stylistId,
  title: 'Appointment Cancelled',
  message: `${clientName} cancelled their appointment`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentId,
});

// Send push notification
await sendManualPushNotification(
  stylistId,
  'Appointment Cancelled',
  `${clientName} cancelled their appointment`,
  { 
    type: 'appointment_cancelled',
    appointmentId: appointmentId 
  }
);
```

### Example 3: Send Notification When Appointment is Confirmed

```typescript
// Update appointment
await updateDoc(doc(db, 'appointments', appointmentId), {
  status: 'confirmed',
  confirmedAt: Timestamp.now(),
});

// Notify client
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: clientId,
  title: 'Appointment Confirmed',
  message: `Your appointment on ${appointmentDate} has been confirmed!`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentId,
});

// Send push
await sendManualPushNotification(
  clientId,
  'Appointment Confirmed',
  `Your appointment on ${appointmentDate} has been confirmed!`,
  { 
    type: 'appointment_confirmed',
    appointmentId: appointmentId 
  }
);
```

### Example 4: Send Batch Notifications

```typescript
// Send to multiple users
const stylistIds = ['stylist1', 'stylist2', 'stylist3'];

for (const stylistId of stylistIds) {
  // Create notification
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    recipientId: stylistId,
    title: 'Salon Announcement',
    message: 'We will be closed tomorrow for maintenance',
    type: 'general',
    isRead: false,
    createdAt: Timestamp.now(),
  });

  // Send push
  await sendManualPushNotification(
    stylistId,
    'Salon Announcement',
    'We will be closed tomorrow for maintenance'
  );
}
```

### Example 5: Send Reminder Notification

```typescript
// 1 hour before appointment
const reminderTime = new Date(appointmentDate);
reminderTime.setHours(reminderTime.getHours() - 1);

// Schedule this to run at reminderTime (use a scheduler or check periodically)
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: clientId,
  title: 'Appointment Reminder',
  message: `Your appointment is in 1 hour at ${appointmentTime}`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentId,
});

await sendManualPushNotification(
  clientId,
  'Appointment Reminder',
  `Your appointment is in 1 hour at ${appointmentTime}`,
  { 
    type: 'appointment_reminder',
    appointmentId: appointmentId 
  }
);
```

## Where to Add This Code

### 1. In Appointment Creation Screen
File: `src/screens/client/BookingScreen.tsx` or similar

```typescript
// After creating appointment
await sendManualPushNotification(stylistId, title, message);
```

### 2. In Appointment Management Screen
File: `src/screens/stylist/AppointmentDetailsScreen.tsx`

```typescript
// When confirming/cancelling appointment
await sendManualPushNotification(clientId, title, message);
```

### 3. In Admin Panel
For sending announcements to all users

## Important Notes

### ✅ Advantages of Manual Push:
- **Free** - No Cloud Functions cost
- **Full control** - You decide when to send
- **Immediate** - No function cold start delay
- **Simple** - Just one function call

### ⚠️ Limitations:
- Must call manually in your code
- Can't send push if app isn't running the code
- No automatic triggers from Firestore changes

### 💡 Best Practices:
1. **Always create notification in Firestore first**, then send push
2. **Handle errors gracefully** - push might fail if user has no token
3. **Don't spam** - Only send important notifications
4. **Test thoroughly** - Verify push works before production

## Testing

Use the test buttons in the Notifications screen:
- **"Local (5s)"** - Tests local notification
- **"Firestore"** - Tests creating notification + manual push

## Upgrading to Cloud Functions Later

When you're ready to upgrade to Blaze plan:

1. Upgrade: https://console.firebase.google.com/project/david-salon-fff6d/usage/details
2. Deploy functions: `firebase deploy --only functions`
3. Remove manual `sendManualPushNotification` calls
4. Notifications will be sent automatically!

## Cost Comparison

### Manual Push (Current - Free):
- ✅ $0/month
- ✅ Unlimited notifications
- ⚠️ Requires code changes for each notification type

### Cloud Functions (Blaze Plan):
- ✅ Automatic notifications
- ✅ No code changes needed
- ✅ Free tier: 2M invocations/month
- 💰 Likely $0/month for your usage
- 💰 Only pay if you exceed free tier

## Summary

You're all set with **free manual push notifications**! 

Just call `sendManualPushNotification()` after creating any notification in Firestore, and users will receive push notifications instantly.

No Cloud Functions needed! 🎉
