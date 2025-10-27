# Expo Go Notifications Fix

## Problem
Starting from Expo SDK 53+, push notifications (`expo-notifications`) no longer work in Expo Go. This causes the error:
```
ERROR expo-notifications: Android Push notifications (remote notifications) functionality 
provided by expo-notifications was removed from Expo Go with the release of SDK 53.
```

## Solution Applied
The app now detects when running in Expo Go and gracefully skips notification initialization to prevent errors.

### Changes Made

1. **`src/services/pushNotifications.ts`**
   - Added Expo Go detection: `const isExpoGo = Constants.appOwnership === 'expo'`
   - Conditionally set notification handler only when NOT in Expo Go
   - Skip notification registration in `registerForPushNotificationsAsync()` when in Expo Go
   - Skip notification listeners in `setupNotificationListeners()` when in Expo Go
   - All functions log warnings when skipped in Expo Go

2. **`App.tsx`**
   - Added `Constants` import from `expo-constants`
   - Added Expo Go check before calling `Notifications.setBadgeCountAsync(0)`

## Testing in Expo Go
You can now run the app in Expo Go without errors. Push notifications will be disabled, but you'll see console warnings like:
```
⚠️ Push notifications are not available in Expo Go (SDK 53+). Use a development build instead.
```

## To Enable Push Notifications (Production)

### Option 1: Create a Development Build (Recommended)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**:
   ```bash
   eas login
   ```

3. **Build for Android**:
   ```bash
   eas build --profile development --platform android
   ```

4. **Install the APK** on your device and run:
   ```bash
   npx expo start --dev-client
   ```

### Option 2: Build Production APK

```bash
eas build --profile preview --platform android
```

### Option 3: Build for Production Release

```bash
eas build --profile production --platform android
```

## Important Notes

- **Expo Go**: Notifications are disabled but app works normally
- **Development Build**: Full notification support with hot reload
- **Production Build**: Full notification support for release

## Configuration Files
Your EAS configuration is already set up in `eas.json` with:
- Development profile (with simulator support)
- Preview profile (APK for testing)
- Production profile (App Bundle for Play Store)

## Next Steps
1. Continue development in Expo Go (notifications disabled)
2. When ready to test notifications, create a development build
3. For production release, use the production build profile
