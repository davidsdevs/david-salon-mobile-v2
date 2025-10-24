# Notification Usage Examples

## Quick Start

The notification system is already initialized in `App.tsx`. Here's how to send notifications to stylists when appointment events occur.

## Example 1: Send Notification When Client Cancels Appointment

```typescript
import { StylistNotificationService } from './src/services/stylistNotificationService';

// In your appointment cancellation handler
const handleCancelAppointment = async (appointment) => {
  try {
    // Cancel the appointment in Firebase
    await cancelAppointmentInFirebase(appointment.id);
    
    // Send notifications to stylist (Push + Email + In-app)
    await StylistNotificationService.notifyOfCancellation({
      stylistId: appointment.stylistId,
      stylistEmail: appointment.stylistEmail, // Get from stylist profile
      stylistName: appointment.stylistName,   // Get from stylist profile
      clientName: appointment.clientName,
      appointmentDate: 'October 23, 2025',
      appointmentTime: '10:00 AM',
      serviceName: appointment.serviceName,
    });
    
    console.log('✅ Stylist notified of cancellation');
  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
  }
};
```

## Example 2: Send Notification When New Appointment is Booked

```typescript
import { StylistNotificationService } from './src/services/stylistNotificationService';

// In your appointment booking handler
const handleBookAppointment = async (appointmentData) => {
  try {
    // Create appointment in Firebase
    const newAppointment = await createAppointmentInFirebase(appointmentData);
    
    // Send notifications to stylist
    await StylistNotificationService.notifyOfNewAppointment({
      stylistId: appointmentData.stylistId,
      stylistEmail: 'stylist@example.com', // Fetch from stylist profile
      stylistName: 'Maria Santos',          // Fetch from stylist profile
      clientName: appointmentData.clientName,
      appointmentDate: appointmentData.date,
      appointmentTime: appointmentData.time,
      serviceName: appointmentData.serviceName,
    });
    
    console.log('✅ Stylist notified of new appointment');
  } catch (error) {
    console.error('❌ Error booking appointment:', error);
  }
};
```

## Example 3: Send Notification When Appointment is Confirmed

```typescript
import { StylistNotificationService } from './src/services/stylistNotificationService';

// In your appointment confirmation handler
const handleConfirmAppointment = async (appointment) => {
  try {
    // Update appointment status in Firebase
    await updateAppointmentStatus(appointment.id, 'confirmed');
    
    // Send notifications to stylist
    await StylistNotificationService.notifyOfConfirmation({
      stylistId: appointment.stylistId,
      stylistEmail: appointment.stylistEmail,
      stylistName: appointment.stylistName,
      clientName: appointment.clientName,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      serviceName: appointment.serviceName,
    });
    
    console.log('✅ Stylist notified of confirmation');
  } catch (error) {
    console.error('❌ Error confirming appointment:', error);
  }
};
```

## Example 4: Send Notification When Appointment is Rescheduled

```typescript
import { StylistNotificationService } from './src/services/stylistNotificationService';

// In your appointment reschedule handler
const handleRescheduleAppointment = async (appointment, newDate, newTime) => {
  try {
    // Update appointment in Firebase
    await updateAppointmentDateTime(appointment.id, newDate, newTime);
    
    // Send notifications to stylist
    await StylistNotificationService.notifyOfReschedule({
      stylistId: appointment.stylistId,
      stylistEmail: appointment.stylistEmail,
      stylistName: appointment.stylistName,
      clientName: appointment.clientName,
      oldDate: appointment.date,
      oldTime: appointment.time,
      newDate: newDate,
      newTime: newTime,
      serviceName: appointment.serviceName,
    });
    
    console.log('✅ Stylist notified of reschedule');
  } catch (error) {
    console.error('❌ Error rescheduling appointment:', error);
  }
};
```

## Example 5: Send Appointment Reminder

```typescript
import { StylistNotificationService } from './src/services/stylistNotificationService';

// In a scheduled job or reminder system
const sendAppointmentReminder = async (appointment) => {
  try {
    // Send reminder to stylist (Email + In-app)
    await StylistNotificationService.sendAppointmentReminder({
      stylistId: appointment.stylistId,
      stylistEmail: appointment.stylistEmail,
      stylistName: appointment.stylistName,
      clientName: appointment.clientName,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      serviceName: appointment.serviceName,
    });
    
    console.log('✅ Reminder sent to stylist');
  } catch (error) {
    console.error('❌ Error sending reminder:', error);
  }
};
```

## Testing Notifications

### Test Push Notification

```typescript
import { PushNotificationService } from './src/services/pushNotificationService';

// Send a test push notification
const testPushNotification = async () => {
  await PushNotificationService.sendLocalNotification({
    title: 'Test Notification',
    body: 'This is a test notification from David\'s Salon',
    data: { test: true },
  });
};
```

### Test Email Notification

```typescript
import { EmailNotificationService } from './src/services/emailNotificationService';

// Send a test email
const testEmailNotification = async () => {
  await EmailNotificationService.sendEmail({
    to_email: 'your-test-email@example.com',
    to_name: 'Test User',
    subject: 'Test Email from David\'s Salon',
    message: 'This is a test email notification.',
  });
};
```

## Integration Points

Add notification calls at these key points in your app:

1. **Client Booking Screen** - When client books an appointment
2. **Client Appointment Screen** - When client cancels or reschedules
3. **Admin Dashboard** - When admin confirms appointments
4. **Scheduled Jobs** - For appointment reminders (1 day before, 1 hour before)

## Getting Stylist Information

You'll need to fetch stylist email and name from Firebase:

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from './src/config/firebase';

const getStylistInfo = async (stylistId: string) => {
  const stylistDoc = await getDoc(doc(db, 'users', stylistId));
  if (stylistDoc.exists()) {
    const data = stylistDoc.data();
    return {
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
    };
  }
  return null;
};

// Usage
const stylistInfo = await getStylistInfo(appointment.stylistId);
if (stylistInfo) {
  await StylistNotificationService.notifyOfCancellation({
    stylistId: appointment.stylistId,
    stylistEmail: stylistInfo.email,
    stylistName: stylistInfo.name,
    // ... rest of the data
  });
}
```

## Important Notes

1. **EmailJS Setup Required**: Before email notifications work, you must:
   - Create an account at https://www.emailjs.com/
   - Set up an email service
   - Create an email template
   - Update credentials in `src/services/emailNotificationService.ts`

2. **Push Notification Permissions**: Users must grant notification permissions. The app requests this automatically on startup.

3. **Testing on Device**: Push notifications only work on physical devices or emulators with Google Play Services (Android) or proper provisioning (iOS).

4. **Rate Limiting**: Consider implementing rate limiting to avoid sending too many notifications.

5. **Error Handling**: Always wrap notification calls in try-catch blocks as shown in the examples.
