// Utility function to update user roles in Firestore
// This can be called to add roles array to existing users

import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';

export const updateUserRoles = async (userId: string, roles: string[]) => {
  try {
    console.log('🔄 Updating user roles:', { userId, roles });
    
    // Update the user document with roles array
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      roles: roles,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ User roles updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating user roles:', error);
    return false;
  }
};

// Function to add roles to existing user (for testing)
export const addRolesToExistingUser = async (email: string, roles: string[]) => {
  try {
    console.log('🔄 Adding roles to existing user:', { email, roles });
    
    // This would need to be called from a secure environment
    // For now, we'll just log the instruction
    console.log('📝 To add roles to user, run this in Firebase Console:');
    console.log(`db.collection('users').where('email', '==', '${email}').get().then(snapshot => {
      snapshot.forEach(doc => {
        doc.ref.update({
          roles: ${JSON.stringify(roles)},
          updatedAt: new Date().toISOString()
        });
      });
    });`);
    
    return true;
  } catch (error) {
    console.error('❌ Error adding roles to user:', error);
    return false;
  }
};
