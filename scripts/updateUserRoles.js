// Script to update existing user with roles array
// This will add roles to the chicorlcruz@gmail.com user

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = require('firebase/firestore');

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

async function updateUserRoles() {
  try {
    console.log('🔄 Looking for user: chicorlcruz@gmail.com');
    
    // Query users collection by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'chicorlcruz@gmail.com'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No user found with email: chicorlcruz@gmail.com');
      return;
    }
    
    // Update each matching user
    const updatePromises = [];
    querySnapshot.forEach((userDoc) => {
      console.log('🔄 Found user:', userDoc.id);
      const userRef = doc(db, 'users', userDoc.id);
      const updatePromise = updateDoc(userRef, {
        roles: ['client', 'stylist'],
        updatedAt: new Date().toISOString()
      });
      updatePromises.push(updatePromise);
    });
    
    await Promise.all(updatePromises);
    console.log('✅ Successfully updated user roles!');
    console.log('📧 Email: chicorlcruz@gmail.com');
    console.log('👤 Roles: client, stylist');
    console.log('🎉 Now login with this user to test the role selection modal!');

  } catch (error) {
    console.error('❌ Error updating user roles:', error);
  }
}

updateUserRoles();
