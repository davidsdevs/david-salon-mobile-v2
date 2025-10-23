// Utility function to clear all app data during logout
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllAppData = async (): Promise<void> => {
  try {
    console.log('🧹 clearAllAppData: Starting complete data clearing...');
    
    // Clear specific known keys
    const knownKeys = [
      'user',
      'authToken', 
      'refreshToken',
      'branchId',
      'selectedRole',
      'userRoles',
      'userType',
      'userName',
      'userEmail',
      'membershipLevel',
      'onboardingComplete',
      'isWaitingForRoleSelection',
      'hasCheckedRoles',
      'showRoleModal',
      'userRoles',
      'pendingUser',
      'isAuthenticated',
      'isLoading',
      'error',
      'token',
      'refreshToken'
    ];
    
    console.log('🧹 clearAllAppData: Clearing known keys...');
    await AsyncStorage.multiRemove(knownKeys);
    
    // Get all remaining keys and clear them (nuclear option)
    const allKeys = await AsyncStorage.getAllKeys();
    if (allKeys.length > 0) {
      console.log('🧹 clearAllAppData: Clearing all remaining keys:', allKeys);
      await AsyncStorage.multiRemove(allKeys);
    }
    
    // Verify everything is cleared
    const remainingKeys = await AsyncStorage.getAllKeys();
    console.log('🧹 clearAllAppData: Remaining keys after clearing:', remainingKeys);
    
    console.log('✅ clearAllAppData: All data cleared successfully');
  } catch (error) {
    console.error('❌ clearAllAppData error:', error);
    throw error;
  }
};

export default clearAllAppData;
