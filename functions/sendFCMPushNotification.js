/**
 * Firebase Cloud Messaging (FCM) Push Notifications
 * Uses device push tokens (FCM for Android, APNs for iOS)
 * FREE and production-ready
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Send FCM push notification when a notification document is created
 * Triggered automatically when a new document is added to 'notifications' collection
 */
exports.sendFCMPushNotificationOnCreate = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      const recipientId = notification.recipientId;

      if (!recipientId) {
        console.log('No recipient ID found in notification');
        return null;
      }

      // Get user's push token from Firestore
      const userDoc = await db.collection('users').doc(recipientId).get();
      
      if (!userDoc.exists) {
        console.log('User not found:', recipientId);
        return null;
      }

      const userData = userDoc.data();
      const pushToken = userData.expoPushToken || userData.fcmToken || userData.pushToken;

      if (!pushToken) {
        console.log('No push token found for user:', recipientId);
        return null;
      }

      // Prepare FCM message
      const message = {
        token: pushToken,
        notification: {
          title: notification.title || 'David\'s Salon',
          body: notification.message || '',
        },
        data: {
          notificationId: context.params.notificationId,
          type: notification.type || 'general',
          ...notification.data || {},
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

      // Send notification via FCM
      const response = await admin.messaging().send(message);
      console.log('✅ FCM notification sent successfully:', response);

      // Update notification document with sent status
      await snap.ref.update({
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmResponse: response,
      });

      return response;
    } catch (error) {
      console.error('❌ Error sending FCM notification:', error);
      
      // Update notification with error
      await snap.ref.update({
        sent: false,
        error: error.message,
        errorAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    }
  });

/**
 * Callable function to send FCM push notification
 * Call this from your app: functions.httpsCallable('sendFCMPushNotification')
 */
exports.sendFCMPushNotification = functions.https.onCall(async (data, context) => {
  try {
    const { userId, title, body, notificationData } = data;

    if (!userId || !title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: userId, title, body'
      );
    }

    // Get user's push token
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const pushToken = userData.expoPushToken || userData.fcmToken || userData.pushToken;

    if (!pushToken) {
      throw new functions.https.HttpsError('not-found', 'No push token found for user');
    }

    // Prepare FCM message
    const message = {
      token: pushToken,
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

    // Send notification
    const response = await admin.messaging().send(message);
    console.log('✅ FCM notification sent:', response);

    // Create notification document in Firestore
    await db.collection('notifications').add({
      recipientId: userId,
      title: title,
      message: body,
      type: notificationData?.type || 'general',
      data: notificationData || {},
      isRead: false,
      sent: true,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fcmResponse: response,
    });

    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Callable function to send batch FCM push notifications
 * Call this from your app: functions.httpsCallable('sendBatchFCMPushNotifications')
 */
exports.sendBatchFCMPushNotifications = functions.https.onCall(async (data, context) => {
  try {
    const { userIds, title, body, notificationData } = data;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userIds must be a non-empty array'
      );
    }

    if (!title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: title, body'
      );
    }

    const results = {
      success: [],
      failed: [],
    };

    // Process in batches of 500 (FCM limit)
    const batchSize = 500;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Get push tokens for all users in batch
      const userDocs = await Promise.all(
        batch.map(userId => db.collection('users').doc(userId).get())
      );

      const messages = [];
      const notificationDocs = [];

      userDocs.forEach((userDoc, index) => {
        if (!userDoc.exists) {
          results.failed.push({ userId: batch[index], error: 'User not found' });
          return;
        }

        const userData = userDoc.data();
        const pushToken = userData.expoPushToken || userData.fcmToken || userData.pushToken;

        if (!pushToken) {
          results.failed.push({ userId: batch[index], error: 'No push token' });
          return;
        }

        messages.push({
          token: pushToken,
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
        });

        notificationDocs.push({
          recipientId: batch[index],
          title: title,
          message: body,
          type: notificationData?.type || 'general',
          data: notificationData || {},
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Send batch
      if (messages.length > 0) {
        const response = await admin.messaging().sendEach(messages);
        
        response.responses.forEach((resp, index) => {
          if (resp.success) {
            results.success.push({
              userId: batch[index],
              messageId: resp.messageId,
            });
          } else {
            results.failed.push({
              userId: batch[index],
              error: resp.error?.message || 'Unknown error',
            });
          }
        });

        // Create notification documents for successful sends
        const successfulDocs = notificationDocs.filter((_, index) => 
          response.responses[index].success
        );

        if (successfulDocs.length > 0) {
          const batch = db.batch();
          successfulDocs.forEach(doc => {
            const ref = db.collection('notifications').doc();
            batch.set(ref, {
              ...doc,
              sent: true,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }
      }
    }

    console.log(`✅ Batch notifications sent: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  } catch (error) {
    console.error('❌ Error sending batch FCM notifications:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
