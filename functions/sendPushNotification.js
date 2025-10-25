/**
 * Cloud Function to send push notifications when new notifications are created
 * 
 * Triggers automatically when a new notification document is created in Firestore
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Send push notification when a new notification is created
 */
exports.sendPushNotificationOnCreate = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      const recipientId = notification.recipientId;

      console.log('📬 New notification created for user:', recipientId);

      // Get recipient's push token from user document
      const userDoc = await db.collection('users').doc(recipientId).get();
      
      if (!userDoc.exists) {
        console.log('⚠️ User not found:', recipientId);
        return null;
      }

      const userData = userDoc.data();
      const expoPushToken = userData.expoPushToken;

      if (!expoPushToken) {
        console.log('⚠️ User has no push token:', recipientId);
        return null;
      }

      // Send push notification via Expo Push API
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: notification.title || 'New Notification',
        body: notification.message || 'You have a new notification',
        data: {
          notificationId: context.params.notificationId,
          type: notification.type || 'general',
          screen: 'Notifications',
        },
        priority: 'high',
        channelId: 'default',
        badge: 1,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data && result.data.status === 'error') {
        console.error('❌ Push notification error:', result.data.message);
      } else {
        console.log('✅ Push notification sent successfully:', result);
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return null;
    }
  });

/**
 * Manual function to send push notification to a user
 * 
 * Call with:
 * const sendNotif = httpsCallable(functions, 'sendPushNotification');
 * await sendNotif({ userId, title, body, data });
 */
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, title, body, notificationData } = data;

  if (!userId || !title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Get user's push token
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const expoPushToken = userData.expoPushToken;

    if (!expoPushToken) {
      throw new functions.https.HttpsError('failed-precondition', 'User has no push token');
    }

    // Send push notification
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: notificationData || {},
      priority: 'high',
      channelId: 'default',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    return {
      success: true,
      message: 'Push notification sent',
      result: result,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Send push notification to multiple users (batch)
 */
exports.sendBatchPushNotifications = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userIds, title, body, notificationData } = data;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'userIds must be a non-empty array');
  }

  try {
    const messages = [];

    // Get push tokens for all users
    for (const userId of userIds) {
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const expoPushToken = userData.expoPushToken;

        if (expoPushToken) {
          messages.push({
            to: expoPushToken,
            sound: 'default',
            title: title,
            body: body,
            data: notificationData || {},
            priority: 'high',
            channelId: 'default',
          });
        }
      }
    }

    if (messages.length === 0) {
      return {
        success: false,
        message: 'No valid push tokens found',
        sent: 0,
      };
    }

    // Send batch push notifications
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    return {
      success: true,
      message: `Push notifications sent to ${messages.length} users`,
      sent: messages.length,
      result: result,
    };
  } catch (error) {
    console.error('Error sending batch push notifications:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
