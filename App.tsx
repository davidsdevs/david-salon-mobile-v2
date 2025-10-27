import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { AppState, Platform, View, Text, Image } from 'react-native';
import Constants from 'expo-constants';
import { BookingProvider } from './src/context/BookingContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { useForegroundNotifications } from './src/hooks/useForegroundNotifications';

// Import navigation and screens
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { store } from './src/store';
import { STORAGE_KEYS } from './src/constants';
import { RootState } from './src/store';
import { loadStoredAuth, logoutUser } from './src/store/slices/authSlice';
import { 
  registerForPushNotificationsAsync, 
  savePushTokenToUser,
  setupNotificationListeners 
} from './src/services/pushNotifications';
import * as Notifications from 'expo-notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Wrapper component to use notification hook inside provider
function NotificationWrapper({ children }: { children: React.ReactNode }) {
  // Setup foreground notifications (shows push notifications as in-app toasts)
  useForegroundNotifications();
  return <>{children}</>;
}

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
      roles: (user as any)?.roles,
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : []
    });
    
    if (user) {
      // Check if user has roles array
      const userRoles = (user as any)?.roles;
      if (userRoles && Array.isArray(userRoles)) {
        const validRoles = userRoles.filter(role => ['client', 'stylist'].includes(role));
        
        if (validRoles.length > 0) {
          // Use the first valid role
          const newUserType = validRoles[0] as 'client' | 'stylist';
          console.log('🔍 Setting userType to:', newUserType);
          setUserType(newUserType);
        } else {
          // No valid roles, logout user
          console.log('🔍 No valid roles, logging out user');
          dispatch(logoutUser());
          setUserType('client');
        }
      } else {
        // Fallback to userType if roles array is not available
        const userRole = (user as any)?.role || user?.userType;
        console.log('🔍 Checking user role (fallback):', userRole);
        
        if (['client', 'stylist'].includes(userRole)) {
          // Valid role, set userType
          const newUserType = userRole as 'client' | 'stylist';
          console.log('🔍 Valid role (fallback), setting userType to:', newUserType);
          setUserType(newUserType);
        } else {
          // Invalid role, logout user
          console.log('🔍 Invalid role (fallback), logging out user:', userRole);
          dispatch(logoutUser());
          setUserType('client');
        }
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
    
    // Initialize notification services
    initializeNotifications();
  }, [dispatch]);

  // Initialize push notifications and email service
  const initializeNotifications = async () => {
    try {
      console.log('📬 Initializing notification services...');
      
      // Register for push notifications
      const token = await registerForPushNotificationsAsync();
      if (token && user?.id) {
        console.log('✅ Push notification token obtained:', token);
        // Save token to user profile in Firebase
        await savePushTokenToUser(user.id, token);
      }
      
      // Setup notification listeners
      const cleanup = setupNotificationListeners(
        (notification) => {
          console.log('📬 Notification received:', notification);
          // You can show an in-app alert or update UI here
        },
        (response) => {
          console.log('👆 Notification tapped:', response);
          const data = response.notification.request.content.data;
          
          // Handle navigation based on notification type
          if (data['type'] === 'appointment_cancelled' || 
              data['type'] === 'appointment_confirmed' || 
              data['type'] === 'appointment_rescheduled') {
            // Navigate to appointments screen
            console.log('Navigate to appointments for:', data['type']);
          }
        }
      );
      
      // Clean up listeners on unmount
      return cleanup;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  };

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

  // Set up notification badge count (for stylists)
  useEffect(() => {
    if (isAuthenticated && userType === 'stylist') {
      // Clear badge when app is opened
      // Skip in Expo Go to avoid errors
      const isExpoGo = Constants.appOwnership === 'expo';
      if (!isExpoGo) {
        Notifications.setBadgeCountAsync(0);
      }
    }
  }, [isAuthenticated, userType]);

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
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 40
      }}>
        {/* Logo */}
        <Image 
          source={require('./assets/logo.png')} 
          style={{ 
            width: 200, 
            height: 100, 
            marginBottom: 40,
            resizeMode: 'contain'
          }}
        />
        
        {/* Loading Text */}
        <Text style={{ 
          fontSize: 18, 
          color: '#160B53',
          fontFamily: 'Poppins_500Medium',
          textAlign: 'center',
          marginBottom: 20
        }}>
          Loading David's Salon...
        </Text>
        
        {/* Loading Indicator */}
        <View style={{
          width: '80%',
          height: 4,
          backgroundColor: '#E5E5E5',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <View style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#160B53',
            borderRadius: 2
          }} />
        </View>
      </View>
    );
  }

  console.log('🔍 AppContent rendering with props:', { isOnboardingComplete, isLoggedIn, userType, isLoading });
  console.log('🔍 AppContent - About to render RootNavigator with isOnboardingComplete:', isOnboardingComplete);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NotificationProvider>
          <NotificationWrapper>
            <BookingProvider>
              <StatusBar style="auto" />
              <RootNavigator 
                isOnboardingComplete={isOnboardingComplete}
                isLoggedIn={isLoggedIn}
                userType={userType}
              />
            </BookingProvider>
          </NotificationWrapper>
        </NotificationProvider>
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