/**
 * Cloud Functions for David Salon Mobile
 * 
 * Import and export all functions here
 */

const { cleanupOldNotifications, manualCleanupNotifications } = require('./cleanupOldNotifications');
const { 
  sendPushNotificationOnCreate, 
  sendPushNotification, 
  sendBatchPushNotifications 
} = require('./sendPushNotification');
const {
  sendFCMPushNotificationOnCreate,
  sendFCMPushNotification,
  sendBatchFCMPushNotifications
} = require('./sendFCMPushNotification');

// Export all functions
exports.cleanupOldNotifications = cleanupOldNotifications;
exports.manualCleanupNotifications = manualCleanupNotifications;

// Expo Push Notifications (legacy - requires Expo account)
exports.sendPushNotificationOnCreate = sendPushNotificationOnCreate;
exports.sendPushNotification = sendPushNotification;
exports.sendBatchPushNotifications = sendBatchPushNotifications;

// Firebase Cloud Messaging (FCM) - FREE, production-ready
exports.sendFCMPushNotificationOnCreate = sendFCMPushNotificationOnCreate;
exports.sendFCMPushNotification = sendFCMPushNotification;
exports.sendBatchFCMPushNotifications = sendBatchFCMPushNotifications;
