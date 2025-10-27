/**
 * Cleanup old notifications
 * Automatically deletes notifications older than 90 days
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Scheduled function to cleanup old notifications
 * Runs daily at midnight (UTC)
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 0 * * *') // Every day at midnight
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('🧹 Starting cleanup of old notifications...');

      // Calculate date 90 days ago
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(ninetyDaysAgo);

      // Query old notifications
      const oldNotificationsQuery = db
        .collection('notifications')
        .where('createdAt', '<', cutoffTimestamp)
        .limit(500); // Process in batches

      let totalDeleted = 0;
      let hasMore = true;

      while (hasMore) {
        const snapshot = await oldNotificationsQuery.get();
        
        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        // Delete in batch
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += snapshot.size;

        console.log(`🗑️ Deleted ${snapshot.size} old notifications`);

        // If we got less than the limit, we're done
        if (snapshot.size < 500) {
          hasMore = false;
        }
      }

      console.log(`✅ Cleanup complete: ${totalDeleted} notifications deleted`);
      return { success: true, deleted: totalDeleted };
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Callable function to manually trigger cleanup
 * Useful for testing or manual cleanup
 */
exports.manualCleanupNotifications = functions.https.onCall(async (data, context) => {
  try {
    // Optional: Add authentication check
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    // }

    const daysOld = data.daysOld || 90;

    console.log(`🧹 Manual cleanup: Deleting notifications older than ${daysOld} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    const oldNotificationsQuery = db
      .collection('notifications')
      .where('createdAt', '<', cutoffTimestamp)
      .limit(500);

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const snapshot = await oldNotificationsQuery.get();
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += snapshot.size;

      if (snapshot.size < 500) {
        hasMore = false;
      }
    }

    console.log(`✅ Manual cleanup complete: ${totalDeleted} notifications deleted`);
    return { success: true, deleted: totalDeleted, daysOld };
  } catch (error) {
    console.error('❌ Error in manual cleanup:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
