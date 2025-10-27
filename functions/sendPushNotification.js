/**
 * Expo Push Notifications (Legacy)
 * Uses Expo Push Token
 * Note: This is the older method. Use FCM for production.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Send Expo push notification when a notification document is created
 */
exports.sendPushNotificationOnCreate = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      const recipientId = notification.recipientId;

      if (!recipientId) {
        console.log('No recipient ID found in notification');
        return null;
      }

      // Get user's Expo push token
      const userDoc = await db.collection('users').doc(recipientId).get();
      
      if (!userDoc.exists) {
        console.log('User not found:', recipientId);
        return null;
      }

      const userData = userDoc.data();
      const expoPushToken = userData.expoPushToken;

      if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken[')) {
        console.log('No valid Expo push token found for user:', recipientId);
        return null;
      }

      // Prepare Expo push message
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: notification.title || 'David\'s Salon',
        body: notification.message || '',
        data: {
          notificationId: context.params.notificationId,
          type: notification.type || 'general',
          ...notification.data || {},
        },
        priority: 'high',
        channelId: 'default',
      };

      // Send to Expo Push API
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
      console.log('✅ Expo push notification sent:', result);

      // Update notification document
      await snap.ref.update({
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        expoResponse: result,
      });

      return result;
    } catch (error) {
      console.error('❌ Error sending Expo push notification:', error);
      
      await snap.ref.update({
        sent: false,
        error: error.message,
        errorAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    }
  });

/**
 * Callable function to send Expo push notification
 */
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  try {
    const { userId, title, body, notificationData } = data;

    if (!userId || !title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: userId, title, body'
      );
    }

    // Get user's Expo push token
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const expoPushToken = userData.expoPushToken;

    if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken[')) {
      throw new functions.https.HttpsError('not-found', 'No valid Expo push token found');
    }

    // Prepare message
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: notificationData || {},
      priority: 'high',
      channelId: 'default',
    };

    // Send to Expo Push API
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
    console.log('✅ Expo push notification sent:', result);

    // Create notification document
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
      expoResponse: result,
    });

    return { success: true, result };
  } catch (error) {
    console.error('❌ Error sending Expo push notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Callable function to send batch Expo push notifications
 */
exports.sendBatchPushNotifications = functions.https.onCall(async (data, context) => {
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

    // Get all user tokens
    const userDocs = await Promise.all(
      userIds.map(userId => db.collection('users').doc(userId).get())
    );

    const messages = [];
    const validUserIds = [];

    userDocs.forEach((userDoc, index) => {
      if (!userDoc.exists) return;

      const userData = userDoc.data();
      const expoPushToken = userData.expoPushToken;

      if (expoPushToken && expoPushToken.startsWith('ExponentPushToken[')) {
        messages.push({
          to: expoPushToken,
          sound: 'default',
          title: title,
          body: body,
          data: notificationData || {},
          priority: 'high',
          channelId: 'default',
        });
        validUserIds.push(userIds[index]);
      }
    });

    if (messages.length === 0) {
      throw new functions.https.HttpsError('not-found', 'No valid push tokens found');
    }

    // Send batch to Expo Push API
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
    console.log(`✅ Batch Expo notifications sent: ${messages.length} messages`);

    // Create notification documents
    const batch = db.batch();
    validUserIds.forEach(userId => {
      const ref = db.collection('notifications').doc();
      batch.set(ref, {
        recipientId: userId,
        title: title,
        message: body,
        type: notificationData?.type || 'general',
        data: notificationData || {},
        isRead: false,
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    return { success: true, sent: messages.length, result };
  } catch (error) {
    console.error('❌ Error sending batch Expo notifications:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
