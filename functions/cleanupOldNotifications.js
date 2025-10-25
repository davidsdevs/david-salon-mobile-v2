/**
 * Cloud Function to automatically delete notifications older than 90 days
 * 
 * Deploy with:
 * firebase deploy --only functions:cleanupOldNotifications
 * 
 * This function runs daily at midnight UTC
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Starting cleanup of old notifications...');

      // Calculate date 90 days ago
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const ninetyDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(ninetyDaysAgo);

      // Query notifications older than 90 days
      const oldNotificationsQuery = db
        .collection('notifications')
        .where('createdAt', '<', ninetyDaysAgoTimestamp)
        .limit(500); // Process in batches of 500

      const snapshot = await oldNotificationsQuery.get();

      if (snapshot.empty) {
        console.log('No old notifications to delete');
        return null;
      }

      // Delete in batches
      const batch = db.batch();
      let deleteCount = 0;

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deleteCount++;
      });

      await batch.commit();
      console.log(`Successfully deleted ${deleteCount} old notifications`);

      // If we hit the limit, there might be more to delete
      if (deleteCount === 500) {
        console.log('More notifications to delete, will run again tomorrow');
      }

      return null;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  });

/**
 * Alternative: HTTP-triggered function for manual cleanup
 * 
 * Call with:
 * curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/manualCleanupNotifications \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 */
exports.manualCleanupNotifications = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Optional: Verify user has admin role
  // const userDoc = await db.collection('users').doc(context.auth.uid).get();
  // if (!userDoc.exists || !userDoc.data().roles?.includes('admin')) {
  //   throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
  // }

  try {
    const daysAgo = data.daysAgo || 90;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const targetTimestamp = admin.firestore.Timestamp.fromDate(targetDate);

    const oldNotificationsQuery = db
      .collection('notifications')
      .where('createdAt', '<', targetTimestamp)
      .limit(500);

    const snapshot = await oldNotificationsQuery.get();

    if (snapshot.empty) {
      return { success: true, deletedCount: 0, message: 'No old notifications to delete' };
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return {
      success: true,
      deletedCount: snapshot.size,
      message: `Successfully deleted ${snapshot.size} notifications older than ${daysAgo} days`,
    };
  } catch (error) {
    console.error('Error in manual cleanup:', error);
    throw new functions.https.HttpsError('internal', 'Failed to cleanup notifications');
  }
});
