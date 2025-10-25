const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Send push notification using Firebase Cloud Messaging (FCM)
 * This is FREE and works without Expo account
 * 
 * Automatically triggered when a notification is created in Firestore
 */
exports.sendFCMPushNotificationOnCreate = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      const { recipientId, title, message } = notification;

      console.log('📬 New notification created for user:', recipientId);

      // Get user's FCM token from Firestore
      const userDoc = await admin.firestore().collection('users').doc(recipientId).get();
      
      if (!userDoc.exists) {
        console.log('⚠️ User not found:', recipientId);
        return null;
      }

      const userData = userDoc.data();
      const fcmToken = userData.fcmPushToken || userData.expoPushToken;

      if (!fcmToken) {
        console.log('⚠️ User has no FCM token:', recipientId);
        return null;
      }

      // Send FCM notification
      const fcmMessage = {
        token: fcmToken,
        notification: {
          title: title,
          body: message,
        },
        data: {
          notificationId: context.params.notificationId,
          type: notification.type || 'general',
          appointmentId: notification.appointmentId || '',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
            color: '#160B53',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(fcmMessage);
      console.log('✅ FCM notification sent successfully:', response);

      return response;
    } catch (error) {
      console.error('❌ Error sending FCM notification:', error);
      return null;
    }
  });

/**
 * Manual function to send FCM push notification
 * Call this from your app using httpsCallable
 */
exports.sendFCMPushNotification = functions.https.onCall(async (data, context) => {
  try {
    const { userId, title, body, notificationData } = data;

    // Get user's FCM token
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmPushToken || userData.expoPushToken;

    if (!fcmToken) {
      throw new functions.https.HttpsError('failed-precondition', 'User has no FCM token');
    }

    // Send FCM notification
    const fcmMessage = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: notificationData || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          color: '#160B53',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(fcmMessage);
    console.log('✅ FCM notification sent successfully:', response);

    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Send batch FCM notifications to multiple users
 */
exports.sendBatchFCMPushNotifications = functions.https.onCall(async (data, context) => {
  try {
    const { userIds, title, body, notificationData } = data;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'userIds must be a non-empty array');
    }

    const results = [];

    for (const userId of userIds) {
      try {
        // Get user's FCM token
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
          console.log('⚠️ User not found:', userId);
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }

        const userData = userDoc.data();
        const fcmToken = userData.fcmPushToken || userData.expoPushToken;

        if (!fcmToken) {
          console.log('⚠️ User has no FCM token:', userId);
          results.push({ userId, success: false, error: 'No FCM token' });
          continue;
        }

        // Send FCM notification
        const fcmMessage = {
          token: fcmToken,
          notification: {
            title: title,
            body: body,
          },
          data: notificationData || {},
          android: {
            priority: 'high',
            notification: {
              channelId: 'default',
              sound: 'default',
              color: '#160B53',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        };

        const response = await admin.messaging().send(fcmMessage);
        results.push({ userId, success: true, messageId: response });
      } catch (error) {
        console.error(`❌ Error sending to user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }

    return { results };
  } catch (error) {
    console.error('❌ Error in batch send:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
