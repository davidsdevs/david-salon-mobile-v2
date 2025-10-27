# Foreground Push Notifications (In-App)

This app now supports **foreground push notifications** - push notifications that display as beautiful in-app toasts when the user is actively using the app.

## What This Means

- ✅ **Push notifications work when app is open** (foreground)
- ✅ **Automatic**: Push notifications are automatically shown as in-app toasts
- ✅ **Beautiful UI**: Toast-style notifications with icons and colors
- ✅ **4 types**: Success, Error, Warning, Info (auto-detected from notification data)
- ✅ **Auto-dismiss**: Notifications disappear after 5 seconds
- ✅ **Manual dismiss**: Users can close notifications with X button
- ✅ **Multiple notifications**: Stack vertically
- ✅ **Works on iOS and Android**

## How It Works

When a push notification is received while the app is in the foreground:
1. The notification is intercepted by `useForegroundNotifications` hook
2. It's automatically displayed as an in-app toast notification
3. The notification type is determined from the `data.type` field
4. Users see a beautiful notification instead of the default system alert

## Setup (Already Done)

The foreground push notification system is already set up in the app:

1. **NotificationProvider** wraps the entire app (`App.tsx`)
2. **NotificationWrapper** with `useForegroundNotifications` hook is active
3. **Push notification handler** is configured in `src/services/pushNotifications.ts`

**No additional setup needed!** Push notifications will automatically display as in-app toasts when received.

## Notification Types

### Success (Green)
- Use for: Successful operations, confirmations
- Icon: Checkmark circle
- Color: #10B981

### Error (Red)
- Use for: Errors, failures, critical issues
- Icon: Close circle
- Color: #EF4444

### Warning (Orange)
- Use for: Warnings, cautions, important notices
- Icon: Warning triangle
- Color: #F59E0B

### Info (Blue)
- Use for: General information, tips, updates
- Icon: Information circle
- Color: #3B82F6

## Sending Push Notifications

To send push notifications from your backend or Cloud Functions, include a `type` field in the notification data to control the UI appearance:

### Example: Appointment Confirmed (Success)
```javascript
{
  to: userPushToken,
  title: 'Appointment Confirmed!',
  body: 'Your appointment is confirmed for Oct 28, 2:00 PM',
  data: {
    type: 'appointment_confirmed', // Will show as SUCCESS (green)
    appointmentId: '123'
  }
}
```

### Example: Appointment Cancelled (Error)
```javascript
{
  to: userPushToken,
  title: 'Appointment Cancelled',
  body: 'Your appointment has been cancelled',
  data: {
    type: 'appointment_cancelled', // Will show as ERROR (red)
    appointmentId: '123'
  }
}
```

### Example: Reminder (Warning)
```javascript
{
  to: userPushToken,
  title: 'Appointment Reminder',
  body: 'Your appointment is in 1 hour',
  data: {
    type: 'appointment_reminder', // Will show as WARNING (orange)
    appointmentId: '123'
  }
}
```

### Example: New Message (Info)
```javascript
{
  to: userPushToken,
  title: 'New Message',
  body: 'Sarah sent you a message',
  data: {
    type: 'new_message', // Will show as INFO (blue)
    messageId: '456'
  }
}
```

## Type Detection Logic

The notification type is automatically determined from the `data.type` field:

| Data Type Contains | UI Type | Color | Icon |
|-------------------|---------|-------|------|
| `confirmed`, `approved`, `completed` | Success | Green | ✓ |
| `cancelled`, `rejected`, `failed` | Error | Red | ✗ |
| `warning`, `expiring`, `reminder` | Warning | Orange | ⚠ |
| Everything else | Info | Blue | ℹ |

## Technical Details

### Files Involved

1. **`src/context/NotificationContext.tsx`**
   - Provides the notification UI and context
   - Manages notification state and display

2. **`src/hooks/useForegroundNotifications.ts`**
   - Listens for push notifications in foreground
   - Converts push notifications to in-app toasts
   - Handles type detection

3. **`src/services/pushNotifications.ts`**
   - Configures notification handler
   - Registers for push notifications
   - Manages push tokens

4. **`App.tsx`**
   - Wraps app with NotificationProvider
   - Activates useForegroundNotifications hook

### Behavior

- **Foreground**: Push notifications display as in-app toasts (5 seconds)
- **Background**: Push notifications display as system notifications
- **Closed**: Push notifications display as system notifications
- **Auto-dismiss**: Toasts disappear after 5 seconds
- **Manual dismiss**: Users can tap X to close immediately
- **Multiple**: Notifications stack vertically at the top
