// Test script to add a sample notification to Firestore
// Run this with: node addTestNotification.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add your service account key)
// Download from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addTestNotification() {
  try {
    // Replace this with your actual stylist user ID
    const stylistUserId = '4gf5AOdy4HffVillOmLu68ABgrb2'; // Your stylist ID from the logs
    
    const testNotification = {
      userId: stylistUserId,
      type: 'appointment_cancelled',
      title: 'Test Notification - Appointment Cancelled',
      message: 'John Doe has cancelled their Haircut appointment on October 23, 2025 at 2:00 PM. This is a test notification.',
      data: {
        clientName: 'John Doe',
        appointmentDate: '2025-10-23',
        appointmentTime: '14:00',
        serviceName: 'Haircut',
      },
      isRead: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await db.collection('notifications').add(testNotification);
    console.log('✅ Test notification added successfully with ID:', docRef.id);
    console.log('📬 Notification details:', testNotification);
    console.log('\n🎉 Check your app notifications screen to see it!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test notification:', error);
    process.exit(1);
  }
}

addTestNotification();
