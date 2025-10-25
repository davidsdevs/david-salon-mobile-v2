/**
 * Cloud Functions for David Salon Mobile
 * 
 * Import and export all functions here
 */

const { cleanupOldNotifications, manualCleanupNotifications } = require('./cleanupOldNotifications');

// Export all functions
exports.cleanupOldNotifications = cleanupOldNotifications;
exports.manualCleanupNotifications = manualCleanupNotifications;
