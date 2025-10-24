// Script to add stylist notification for appointment_created
// Run this with: node addStylistNotification.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addStylistNotification() {
  try {
    // Claire Cruz's stylist ID
    const stylistId = '4gf5AOdy4HffVillOmLu68ABgrb2';
    
    const notification = {
      // Appointment Data
      appointmentData: {
        appointmentDate: "2025-10-24",
        appointmentTime: "22:00",
        branchId: "KYiL9JprSX3LBOYzrF6e",
        branchName: "David's Salon",
        clientId: "1qOi4iF1YJOad3eEY7aiqZhxpYf1",
        clientName: "Gwyneth Cruz",
        id: "I1CnaUG8oCK3Kht4DhXb",
        serviceStylistPairs: [
          {
            serviceId: "service_beard",
            serviceName: "Beard Trim",
            servicePrice: 200,
            stylistId: "4gf5AOdy4HffVillOmLu68ABgrb2",
            stylistName: "Claire Cruz"
          },
          {
            serviceId: "service_haircut",
            serviceName: "Haircut",
            servicePrice: 0,
            stylistId: "3xwdBFLGmEQOIfWyqKLaOK3mRG93",
            stylistName: "John Francis Canapati"
          }
        ],
        services: [],
        status: "scheduled",
        stylistId: null,
        stylistName: "Unassigned Stylist"
      },
      
      // Basic notification fields
      appointmentId: "I1CnaUG8oCK3Kht4DhXb",
      createdAt: admin.firestore.Timestamp.now(),
      deepLink: "salonapp://appointment/I1CnaUG8oCK3Kht4DhXb",
      isRead: false,
      message: "New appointment from Gwyneth Cruz for 2025-10-24 at 22:00",
      
      // Push notification data
      pushData: {
        badge: 1,
        body: "New appointment from Gwyneth Cruz for 2025-10-24 at 22:00",
        channel: "appointments",
        data: {
          actionType: "appointment_created",
          appointmentDate: "2025-10-24",
          appointmentId: "I1CnaUG8oCK3Kht4DhXb",
          appointmentTime: "22:00",
          branchId: "KYiL9JprSX3LBOYzrF6e",
          branchName: "David's Salon",
          clientId: "1qOi4iF1YJOad3eEY7aiqZhxpYf1",
          clientName: "Gwyneth Cruz",
          deepLink: "salonapp://appointment/I1CnaUG8oCK3Kht4DhXb",
          params: {
            appointmentId: "I1CnaUG8oCK3Kht4DhXb",
            clientId: "1qOi4iF1YJOad3eEY7aiqZhxpYf1",
            recipientType: "stylist",
            salonId: "KYiL9JprSX3LBOYzrF6e",
            salonName: "David's Salon",
            screen: "AppointmentDetails"
          },
          serviceStylistPairs: [
            {
              serviceId: "service_beard",
              serviceName: "Beard Trim",
              servicePrice: 200,
              stylistId: "4gf5AOdy4HffVillOmLu68ABgrb2",
              stylistName: "Claire Cruz"
            },
            {
              serviceId: "service_haircut",
              serviceName: "Haircut",
              servicePrice: 0,
              stylistId: "3xwdBFLGmEQOIfWyqKLaOK3mRG93",
              stylistName: "John Francis Canapati"
            }
          ],
          services: [],
          status: "scheduled",
          stylistId: null,
          stylistName: "Unassigned Stylist"
        },
        priority: "high",
        sound: "appointment_created.wav",
        title: "New Appointment Booked"
      },
      
      // Recipient information (KEY FIELDS)
      recipientId: stylistId,  // Claire Cruz's ID
      recipientRole: "stylist",
      
      // Notification metadata
      title: "New Appointment Booked",
      type: "appointment_created"
    };

    const docRef = await db.collection('notifications').add(notification);
    console.log('✅ Stylist notification created successfully with ID:', docRef.id);
    console.log('📬 Notification for:', stylistId, '(Claire Cruz)');
    console.log('\n🎉 Check Claire Cruz\'s notifications screen to see it!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding notification:', error);
    process.exit(1);
  }
}

addStylistNotification();
