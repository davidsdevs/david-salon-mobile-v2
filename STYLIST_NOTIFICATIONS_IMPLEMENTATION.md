# 🔔 Stylist Notifications Implementation Guide

Complete guide for sending notifications and push notifications to stylists.

## Scenarios

1. **Client books appointment** → Notify stylist
2. **Client cancels appointment** → Notify stylist
3. **Receptionist books appointment** → Notify stylist
4. **Receptionist confirms appointment** → Notify stylist AND client
5. **Receptionist cancels appointment** → Notify stylist AND client

## Helper Function (Already Created)

```typescript
import { sendManualPushNotification } from '../utils/sendManualPushNotification';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';

// Use this function for all notifications
async function notifyStylist(
  stylistId: string,
  title: string,
  message: string,
  appointmentId?: string
) {
  // Create notification in Firestore
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    recipientId: stylistId,
    title: title,
    message: message,
    type: 'appointment',
    isRead: false,
    createdAt: Timestamp.now(),
    appointmentId: appointmentId,
  });

  // Send push notification
  await sendManualPushNotification(
    stylistId,
    title,
    message,
    { 
      type: 'appointment',
      appointmentId: appointmentId,
      screen: 'Appointments'
    }
  );
}
```

---

## 1. Client Books Appointment

**File**: `src/screens/client/BookingScreen.tsx` (or wherever client books)

**When**: After appointment is successfully created

```typescript
import { sendManualPushNotification } from '../../utils/sendManualPushNotification';

// After creating appointment
const appointmentRef = await addDoc(collection(db, 'appointments'), {
  clientId: user.id,
  clientName: `${user.firstName} ${user.lastName}`,
  stylistId: selectedStylist.id,
  stylistName: selectedStylist.name,
  date: selectedDate,
  time: selectedTime,
  services: selectedServices,
  status: 'pending',
  createdAt: Timestamp.now(),
});

// Get stylist IDs from serviceStylistPairs
const stylistIds = selectedServices.map(service => service.stylistId);
const uniqueStylistIds = [...new Set(stylistIds)]; // Remove duplicates

// Notify each stylist
for (const stylistId of uniqueStylistIds) {
  // Create notification
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    recipientId: stylistId,
    title: 'New Appointment',
    message: `${user.firstName} ${user.lastName} booked an appointment for ${selectedDate} at ${selectedTime}`,
    type: 'appointment',
    isRead: false,
    createdAt: Timestamp.now(),
    appointmentId: appointmentRef.id,
  });

  // Send push notification
  await sendManualPushNotification(
    stylistId,
    'New Appointment',
    `${user.firstName} ${user.lastName} booked an appointment for ${selectedDate} at ${selectedTime}`,
    { 
      type: 'appointment_new',
      appointmentId: appointmentRef.id,
      screen: 'Appointments'
    }
  );
}

// Show success message to client
Alert.alert('Success', 'Appointment booked successfully!');
```

---

## 2. Client Cancels Appointment

**File**: `src/screens/client/AppointmentDetailsScreen.tsx` (or similar)

**When**: After appointment status is updated to 'cancelled'

```typescript
import { sendManualPushNotification } from '../../utils/sendManualPushNotification';

// Update appointment status
await updateDoc(doc(db, 'appointments', appointmentId), {
  status: 'cancelled',
  cancelledBy: 'client',
  cancelledAt: Timestamp.now(),
});

// Get stylist IDs from the appointment
const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
const appointmentData = appointmentDoc.data();
const serviceStylistPairs = appointmentData.serviceStylistPairs || [];
const stylistIds = serviceStylistPairs.map(pair => pair.stylistId);
const uniqueStylistIds = [...new Set(stylistIds)];

// Notify each stylist
for (const stylistId of uniqueStylistIds) {
  // Create notification
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    recipientId: stylistId,
    title: 'Appointment Cancelled',
    message: `${appointmentData.clientName} cancelled their appointment for ${appointmentData.date} at ${appointmentData.time}`,
    type: 'appointment',
    isRead: false,
    createdAt: Timestamp.now(),
    appointmentId: appointmentId,
  });

  // Send push notification
  await sendManualPushNotification(
    stylistId,
    'Appointment Cancelled',
    `${appointmentData.clientName} cancelled their appointment for ${appointmentData.date} at ${appointmentData.time}`,
    { 
      type: 'appointment_cancelled',
      appointmentId: appointmentId,
      screen: 'Appointments'
    }
  );
}

Alert.alert('Success', 'Appointment cancelled');
```

---

## 3. Receptionist Books Appointment

**File**: `src/screens/receptionist/BookAppointmentScreen.tsx` (or similar)

**When**: After receptionist creates appointment for a client

```typescript
import { sendManualPushNotification } from '../../utils/sendManualPushNotification';

// After creating appointment
const appointmentRef = await addDoc(collection(db, 'appointments'), {
  clientId: selectedClient.id,
  clientName: selectedClient.name,
  stylistId: selectedStylist.id,
  stylistName: selectedStylist.name,
  date: selectedDate,
  time: selectedTime,
  services: selectedServices,
  status: 'pending',
  bookedBy: 'receptionist',
  receptionistId: user.id,
  createdAt: Timestamp.now(),
});

// Get stylist IDs
const stylistIds = selectedServices.map(service => service.stylistId);
const uniqueStylistIds = [...new Set(stylistIds)];

// Notify each stylist
for (const stylistId of uniqueStylistIds) {
  // Create notification
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    recipientId: stylistId,
    title: 'New Appointment (Receptionist)',
    message: `New appointment booked for ${selectedClient.name} on ${selectedDate} at ${selectedTime}`,
    type: 'appointment',
    isRead: false,
    createdAt: Timestamp.now(),
    appointmentId: appointmentRef.id,
  });

  // Send push notification
  await sendManualPushNotification(
    stylistId,
    'New Appointment',
    `New appointment booked for ${selectedClient.name} on ${selectedDate} at ${selectedTime}`,
    { 
      type: 'appointment_new',
      appointmentId: appointmentRef.id,
      screen: 'Appointments'
    }
  );
}

// Also notify the client
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: selectedClient.id,
  title: 'Appointment Booked',
  message: `Your appointment has been booked for ${selectedDate} at ${selectedTime}`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentRef.id,
});

await sendManualPushNotification(
  selectedClient.id,
  'Appointment Booked',
  `Your appointment has been booked for ${selectedDate} at ${selectedTime}`,
  { 
    type: 'appointment_booked',
    appointmentId: appointmentRef.id,
    screen: 'Appointments'
  }
);

Alert.alert('Success', 'Appointment booked successfully!');
```

---

## 4. Receptionist Confirms Appointment

**File**: `src/screens/receptionist/AppointmentManagementScreen.tsx` (or similar)

**When**: Receptionist clicks "Confirm" button

```typescript
import { sendManualPushNotification } from '../../utils/sendManualPushNotification';

// Update appointment status
await updateDoc(doc(db, 'appointments', appointmentId), {
  status: 'confirmed',
  confirmedBy: user.id,
  confirmedAt: Timestamp.now(),
});

// Get appointment data
const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
const appointmentData = appointmentDoc.data();

// Notify the CLIENT
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: appointmentData.clientId,
  title: 'Appointment Confirmed',
  message: `Your appointment on ${appointmentData.date} at ${appointmentData.time} has been confirmed!`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentId,
});

await sendManualPushNotification(
  appointmentData.clientId,
  'Appointment Confirmed',
  `Your appointment on ${appointmentData.date} at ${appointmentData.time} has been confirmed!`,
  { 
    type: 'appointment_confirmed',
    appointmentId: appointmentId,
    screen: 'Appointments'
  }
);

// Notify the STYLIST(S)
const serviceStylistPairs = appointmentData.serviceStylistPairs || [];
const stylistIds = serviceStylistPairs.map(pair => pair.stylistId);
const uniqueStylistIds = [...new Set(stylistIds)];

for (const stylistId of uniqueStylistIds) {
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    recipientId: stylistId,
    title: 'Appointment Confirmed',
    message: `Appointment with ${appointmentData.clientName} on ${appointmentData.date} at ${appointmentData.time} has been confirmed`,
    type: 'appointment',
    isRead: false,
    createdAt: Timestamp.now(),
    appointmentId: appointmentId,
  });

  await sendManualPushNotification(
    stylistId,
    'Appointment Confirmed',
    `Appointment with ${appointmentData.clientName} on ${appointmentData.date} at ${appointmentData.time} has been confirmed`,
    { 
      type: 'appointment_confirmed',
      appointmentId: appointmentId,
      screen: 'Appointments'
    }
  );
}

Alert.alert('Success', 'Appointment confirmed');
```

---

## 5. Receptionist Cancels Appointment

**File**: `src/screens/receptionist/AppointmentManagementScreen.tsx`

**When**: Receptionist clicks "Cancel" button

```typescript
import { sendManualPushNotification } from '../../utils/sendManualPushNotification';

// Update appointment status
await updateDoc(doc(db, 'appointments', appointmentId), {
  status: 'cancelled',
  cancelledBy: 'receptionist',
  cancelledById: user.id,
  cancelledAt: Timestamp.now(),
});

// Get appointment data
const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
const appointmentData = appointmentDoc.data();

// Notify the CLIENT
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: appointmentData.clientId,
  title: 'Appointment Cancelled',
  message: `Your appointment on ${appointmentData.date} at ${appointmentData.time} has been cancelled`,
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: appointmentId,
});

await sendManualPushNotification(
  appointmentData.clientId,
  'Appointment Cancelled',
  `Your appointment on ${appointmentData.date} at ${appointmentData.time} has been cancelled`,
  { 
    type: 'appointment_cancelled',
    appointmentId: appointmentId,
    screen: 'Appointments'
  }
);

// Notify the STYLIST(S)
const serviceStylistPairs = appointmentData.serviceStylistPairs || [];
const stylistIds = serviceStylistPairs.map(pair => pair.stylistId);
const uniqueStylistIds = [...new Set(stylistIds)];

for (const stylistId of uniqueStylistIds) {
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    recipientId: stylistId,
    title: 'Appointment Cancelled',
    message: `Appointment with ${appointmentData.clientName} on ${appointmentData.date} at ${appointmentData.time} has been cancelled`,
    type: 'appointment',
    isRead: false,
    createdAt: Timestamp.now(),
    appointmentId: appointmentId,
  });

  await sendManualPushNotification(
    stylistId,
    'Appointment Cancelled',
    `Appointment with ${appointmentData.clientName} on ${appointmentData.date} at ${appointmentData.time} has been cancelled`,
    { 
      type: 'appointment_cancelled',
      appointmentId: appointmentId,
      screen: 'Appointments'
    }
  );
}

Alert.alert('Success', 'Appointment cancelled');
```

---

## Quick Reference: Copy-Paste Template

Use this template for any notification:

```typescript
// 1. Import at top of file
import { sendManualPushNotification } from '../../utils/sendManualPushNotification';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';

// 2. After your action (create/update appointment)
// Create notification in Firestore
await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
  recipientId: RECIPIENT_USER_ID,
  title: 'YOUR_TITLE',
  message: 'YOUR_MESSAGE',
  type: 'appointment',
  isRead: false,
  createdAt: Timestamp.now(),
  appointmentId: APPOINTMENT_ID, // optional
});

// Send push notification
await sendManualPushNotification(
  RECIPIENT_USER_ID,
  'YOUR_TITLE',
  'YOUR_MESSAGE',
  { 
    type: 'appointment_TYPE',
    appointmentId: APPOINTMENT_ID,
    screen: 'Appointments'
  }
);
```

---

## Testing Checklist

- [ ] Client books appointment → Stylist receives notification + push
- [ ] Client cancels appointment → Stylist receives notification + push
- [ ] Receptionist books appointment → Stylist receives notification + push
- [ ] Receptionist books appointment → Client receives notification + push
- [ ] Receptionist confirms appointment → Client receives notification + push
- [ ] Receptionist confirms appointment → Stylist receives notification + push
- [ ] Receptionist cancels appointment → Client receives notification + push
- [ ] Receptionist cancels appointment → Stylist receives notification + push
- [ ] Push notifications work with app closed
- [ ] Push notifications work with phone locked
- [ ] Tapping notification opens app to correct screen

---

## Error Handling

Always wrap in try-catch:

```typescript
try {
  // Create notification and send push
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), { ... });
  await sendManualPushNotification(...);
} catch (error) {
  console.error('Error sending notification:', error);
  // Don't show error to user - notification is not critical
  // The main action (booking/cancelling) already succeeded
}
```

---

## Summary

**For every appointment action:**
1. ✅ Update appointment in Firestore
2. ✅ Create notification in Firestore
3. ✅ Call `sendManualPushNotification()`
4. ✅ Done! User receives push notification instantly

**That's it!** Just 2 lines of code after each action. 🎉
