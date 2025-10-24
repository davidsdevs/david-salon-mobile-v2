# Stylist Notification Setup Guide

This guide explains how to set up push notifications and email notifications for stylists in the David Salon mobile app.

## Overview

Stylists receive notifications through three channels:
1. **Push Notifications** - Real-time mobile notifications
2. **Email Notifications** - Email alerts sent to stylist's email
3. **In-App Notifications** - Notifications visible in the app's notification screen

## Prerequisites

### 1. Install Required Packages

```bash
npx expo install expo-notifications expo-constants
```

### 2. Configure app.json

Add the following to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#160B53",
      "androidMode": "default",
      "androidCollapsedTitle": "David Salon"
    }
  }
}
```

## Email Notification Setup (EmailJS)

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Set Up Email Service

1. Go to **Email Services** in the EmailJS dashboard
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. Copy your **Service ID**

### 3. Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template structure:

```
Subject: {{subject}}

Dear {{to_name}},

{{message}}

Best regards,
{{from_name}}
```

4. Save and copy your **Template ID**

### 4. Get Public Key

1. Go to **Account** → **General**
2. Copy your **Public Key**

### 5. Update Configuration

Open `src/services/emailNotificationService.ts` and update:

```typescript
const EMAILJS_SERVICE_ID = 'your_service_id_here';
const EMAILJS_TEMPLATE_ID = 'your_template_id_here';
const EMAILJS_PUBLIC_KEY = 'your_public_key_here';
```

## Push Notification Setup

### 1. Configure EAS Project

```bash
eas init
```

### 2. Update app.json with EAS Project ID

The project ID will be automatically added to your `app.json` after running `eas init`.

### 3. Build for Push Notifications

For development:
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

For production:
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

## Usage Examples

### Initialize Notifications in App

Add this to your main App component or a root component:

```typescript
import { useEffect } from 'react';
import { PushNotificationService } from './src/services/pushNotificationService';
import { EmailNotificationService } from './src/services/emailNotificationService';

function App() {
  useEffect(() => {
    // Initialize push notifications
    PushNotificationService.registerForPushNotifications();
    
    // Initialize email service
    EmailNotificationService.initialize();
    
    // Listen for notifications
    const notificationListener = PushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );
    
    const responseListener = PushNotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        // Handle navigation based on notification type
      }
    );
    
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
  
  // ... rest of your app
}
```

### Send Notifications to Stylist

```typescript
import { StylistNotificationService } from './src/services/stylistNotificationService';

// When a client cancels an appointment
await StylistNotificationService.notifyOfCancellation({
  stylistId: 'stylist_firebase_id',
  stylistEmail: 'stylist@example.com',
  stylistName: 'Maria Santos',
  clientName: 'John Doe',
  appointmentDate: 'October 23, 2025',
  appointmentTime: '10:00 AM',
  serviceName: 'Haircut',
});

// When a new appointment is booked
await StylistNotificationService.notifyOfNewAppointment({
  stylistId: 'stylist_firebase_id',
  stylistEmail: 'stylist@example.com',
  stylistName: 'Maria Santos',
  clientName: 'Jane Smith',
  appointmentDate: 'October 24, 2025',
  appointmentTime: '2:00 PM',
  serviceName: 'Hair Coloring',
});

// When an appointment is confirmed
await StylistNotificationService.notifyOfConfirmation({
  stylistId: 'stylist_firebase_id',
  stylistEmail: 'stylist@example.com',
  stylistName: 'Maria Santos',
  clientName: 'Bob Johnson',
  appointmentDate: 'October 25, 2025',
  appointmentTime: '11:00 AM',
  serviceName: 'Facial Treatment',
});

// When an appointment is rescheduled
await StylistNotificationService.notifyOfReschedule({
  stylistId: 'stylist_firebase_id',
  stylistEmail: 'stylist@example.com',
  stylistName: 'Maria Santos',
  clientName: 'Alice Brown',
  oldDate: 'October 23, 2025',
  oldTime: '3:00 PM',
  newDate: 'October 26, 2025',
  newTime: '4:00 PM',
  serviceName: 'Manicure',
});
```

## Testing

### Test Push Notifications

```typescript
import { PushNotificationService } from './src/services/pushNotificationService';

// Send a test notification
await PushNotificationService.sendLocalNotification({
  title: 'Test Notification',
  body: 'This is a test notification',
  data: { test: true },
});
```

### Test Email Notifications

```typescript
import { EmailNotificationService } from './src/services/emailNotificationService';

// Send a test email
await EmailNotificationService.sendEmail({
  to_email: 'test@example.com',
  to_name: 'Test User',
  subject: 'Test Email',
  message: 'This is a test email from David Salon',
});
```

## Notification Types

The system supports the following notification types:

- `appointment_cancelled` - When a client cancels an appointment
- `appointment_confirmed` - When an appointment is confirmed
- `appointment_rescheduled` - When an appointment is rescheduled
- `appointment_reminder` - Reminder before an appointment
- `general` - General notifications

## Troubleshooting

### Push Notifications Not Working

1. Check that permissions are granted
2. Verify EAS project ID is correct in app.json
3. Ensure the app is built with EAS
4. Check device notification settings

### Email Notifications Not Sending

1. Verify EmailJS credentials are correct
2. Check EmailJS dashboard for errors
3. Ensure email service is active
4. Check spam folder for test emails

### In-App Notifications Not Showing

1. Verify Firebase is properly configured
2. Check that user ID is correct
3. Ensure Firestore rules allow writes to notifications collection

## Security Notes

- Never commit EmailJS credentials to version control
- Use environment variables for sensitive data
- Implement rate limiting for notification sending
- Validate all notification data before sending

## Support

For issues or questions:
- Check the EmailJS documentation: https://www.emailjs.com/docs/
- Check Expo Notifications documentation: https://docs.expo.dev/versions/latest/sdk/notifications/
- Review Firebase documentation: https://firebase.google.com/docs
