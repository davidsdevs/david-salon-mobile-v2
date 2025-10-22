import AsyncStorage from '@react-native-async-storage/async-storage';

// Reset app data
export const resetApp = async () => {
  try {
    // Clear all AsyncStorage data
    await AsyncStorage.clear();
    
    // You can add other reset logic here
    console.log('App data reset successfully');
  } catch (error) {
    console.error('Error resetting app data:', error);
  }
};

// Reset specific data
export const resetUserData = async () => {
  try {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('onboardingComplete');
    console.log('User data reset successfully');
  } catch (error) {
    console.error('Error resetting user data:', error);
  }
};
