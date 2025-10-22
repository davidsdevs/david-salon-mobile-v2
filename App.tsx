import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { AppState, Platform, View, Text } from 'react-native';

// Import navigation and screens
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { store } from './src/store';
import { STORAGE_KEYS } from './src/constants';
import { RootState } from './src/store';
import { loadStoredAuth, logoutUser } from './src/store/slices/authSlice';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// AppContent component that can use Redux selectors
function AppContent() {
  const dispatch = useDispatch();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<'client' | 'stylist'>('client');
  
  // Get auth state from Redux
  const { isAuthenticated, user, isLoading: authLoading } = useSelector((state: RootState) => state.auth);
  
  // Use Redux auth state for login status
  const isLoggedIn = isAuthenticated;
  
  // Debug Redux auth state changes
  useEffect(() => {
    console.log('🔍 AppContent - Redux auth state changed:', { 
      isAuthenticated, 
      user: user?.email, 
      authLoading,
      isLoggedIn 
    });
    
    // Log when isLoggedIn changes specifically
    if (isLoggedIn !== undefined) {
      console.log('🔍 AppContent - isLoggedIn changed to:', isLoggedIn);
    }
  }, [isAuthenticated, user, authLoading, isLoggedIn]);
  
  // Set user type based on Redux user data
  useEffect(() => {
    console.log('🔍 Setting user type based on user data:', { 
      user: user?.email, 
      userType: user?.userType,
      role: (user as any)?.role,
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : []
    });
    
    if (user) {
      // Check role first to determine if user is allowed
      const userRole = (user as any)?.role || user?.userType;
      console.log('🔍 Checking user role:', userRole);
      
      if (['client', 'stylist'].includes(userRole)) {
        // Valid role, set userType
        const newUserType = userRole as 'client' | 'stylist';
        console.log('🔍 Valid role, setting userType to:', newUserType);
        setUserType(newUserType);
      } else {
        // Invalid role, logout user
        console.log('🔍 Invalid role, logging out user:', userRole);
        dispatch(logoutUser());
        setUserType('client');
      }
    } else {
      // No user data, reset to client
      console.log('🔍 No user data, resetting to client');
      setUserType('client');
    }
  }, [user]);

  console.log('🔍 AppContent - Redux auth state:', { isAuthenticated, user: user?.userType, userRole: (user as any)?.role });
  console.log('🔍 AppContent - Local state:', { isOnboardingComplete, isLoading, userType });
  console.log('🔍 AppContent - Final isLoggedIn:', isLoggedIn);
  console.log('🔍 AppContent - Will use navigator:', userType === 'stylist' ? 'StylistTabNavigator' : 'MainTabNavigator');

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    // Alternative names for better Android compatibility
    'Poppins_400Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins_500Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins_600SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins_700Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    console.log('🔍 useEffect: checkOnboardingStatus and loadStoredAuth called');
    checkOnboardingStatus();
    // Load stored authentication on app startup
    dispatch(loadStoredAuth());
  }, [dispatch]);

  // Listen for app state changes to re-check onboarding status and auth
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        checkOnboardingStatus();
        // Also reload stored auth when app becomes active
        dispatch(loadStoredAuth());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [dispatch]);

  // Periodically check onboarding status and auth (for web compatibility)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const interval = setInterval(() => {
        checkOnboardingStatus();
        // Also reload stored auth periodically on web
        dispatch(loadStoredAuth());
      }, 1000); // Check every second

      return () => clearInterval(interval);
    }
    return undefined;
  }, [dispatch]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      console.log('🔍 Fonts loaded or error occurred:', { fontsLoaded, fontError });
      SplashScreen.hideAsync();
      setIsLoading(false);
    }
  }, [fontsLoaded, fontError]);

  // Timeout for font loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!fontsLoaded && !fontError) {
        console.warn('Font loading timeout - continuing with system fonts');
        SplashScreen.hideAsync();
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError]);

  // Additional timeout to ensure app doesn't get stuck
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.warn('Emergency timeout - forcing app to render');
      SplashScreen.hideAsync();
      setIsLoading(false);
    }, 15000);

    return () => clearTimeout(emergencyTimeout);
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      console.log('🔍 Checking onboarding status...');
      
      // Check if onboarding is already complete
      const onboardingComplete = await AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete);
      const isOnboardingDone = onboardingComplete === 'true';
      
      console.log('🔍 Onboarding status from storage:', { onboardingComplete, isOnboardingDone });
      
      // For development/testing: Always show onboarding first
      // Uncomment the next line if you want to always show onboarding (useful for testing)
      // await AsyncStorage.removeItem(STORAGE_KEYS.onboardingComplete);
      
      // Use the actual onboarding status instead of forcing it
      setIsOnboardingComplete(isOnboardingDone);
      
      // Test AsyncStorage
      console.log('🔍 Testing AsyncStorage...');
      await AsyncStorage.setItem('test', 'value');
      const testValue = await AsyncStorage.getItem('test');
      console.log('🔍 AsyncStorage test result:', testValue);
      
      console.log('🔍 App state:', { isOnboardingComplete: isOnboardingDone, isLoggedIn, userType, isLoading });
      
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to showing onboarding if there's an error
      setIsOnboardingComplete(false);
    }
  };

  if (!fontsLoaded || isLoading) {
    console.log('🔍 App is loading...', { fontsLoaded, isLoading });
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 18, color: '#000000' }}>Loading fonts...</Text>
      </View>
    );
  }

  console.log('🔍 AppContent rendering with props:', { isOnboardingComplete, isLoggedIn, userType, isLoading });
  console.log('🔍 AppContent - About to render RootNavigator with isOnboardingComplete:', isOnboardingComplete);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator 
          isOnboardingComplete={isOnboardingComplete}
          isLoggedIn={isLoggedIn}
          userType={userType}
        />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}