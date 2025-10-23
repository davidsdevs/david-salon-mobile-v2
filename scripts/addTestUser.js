// Script to add a test user with both client and stylist roles
// Run this with: node scripts/addTestUser.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC-6AX8N96wuqEL-p0rQmJFiS-OZ9JEqGo",
  authDomain: "david-salon-fff6d.firebaseapp.com",
  projectId: "david-salon-fff6d",
  storageBucket: "david-salon-fff6d.firebasestorage.app",
  messagingSenderId: "248565145509",
  appId: "1:248565145509:web:a7861697801ebf3848524c",
  measurementId: "G-PB1LMRZD7J",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestUser() {
  try {
    const userId = 'test-user-multi-role';
    const userData = {
      id: userId,
      email: 'chicorlcruz@gmail.com',
      firstName: 'Chico',
      lastName: 'Cruz',
      phone: '+1234567890',
      userType: 'client', // Default userType
      roles: ['client', 'stylist'], // Multiple roles array
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Legacy properties
      name: 'Chico Cruz',
      memberSince: serverTimestamp(),
      points: 0
    };

    // Add to users collection
    await setDoc(doc(db, 'users', userId), userData);
    console.log('✅ Test user added to users collection');

    // Also add to clients collection
    const clientData = {
      ...userData,
      userType: 'client',
      membershipLevel: 'Gold',
      totalVisits: 10,
      totalSpent: 500,
      loyaltyPoints: 100
    };
    await setDoc(doc(db, 'clients', userId), clientData);
    console.log('✅ Test user added to clients collection');

    // Also add to stylists collection
    const stylistData = {
      ...userData,
      userType: 'stylist',
      employeeId: 'EMP123456',
      specialization: ['Haircut', 'Styling'],
      experience: 5,
      rating: 4.8,
      totalClients: 50,
      totalEarnings: 10000,
      isAvailable: true,
      workingHours: {
        monday: { start: '09:00', end: '18:00', isOpen: true },
        tuesday: { start: '09:00', end: '18:00', isOpen: true },
        wednesday: { start: '09:00', end: '18:00', isOpen: true },
        thursday: { start: '09:00', end: '18:00', isOpen: true },
        friday: { start: '09:00', end: '18:00', isOpen: true },
        saturday: { start: '09:00', end: '18:00', isOpen: true },
        sunday: { start: '10:00', end: '16:00', isOpen: false }
      },
      services: ['Haircut', 'Styling', 'Coloring']
    };
    await setDoc(doc(db, 'stylists', userId), stylistData);
    console.log('✅ Test user added to stylists collection');

    console.log('🎉 Test user with multiple roles created successfully!');
    console.log('📧 Email: chicorlcruz@gmail.com');
    console.log('🔑 Password: password123');
    console.log('👤 Roles: client, stylist');

  } catch (error) {
    console.error('❌ Error adding test user:', error);
  }
}

addTestUser();
