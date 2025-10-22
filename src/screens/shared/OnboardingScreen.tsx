import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONTS, APP_CONFIG, STORAGE_KEYS } from '../../constants';

// Import logo
const logoImage = require('../../../assets/logo.png');

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [progress] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';

  console.log('🎯 OnboardingScreen rendered!', { isWeb, screenWidth, screenHeight });

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Animate progress bar over 3 seconds
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(async () => {
      // Complete onboarding after animation
      setTimeout(async () => {
        await AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, 'true');
        console.log('✅ Onboarding completed, app will redirect automatically');
        // Navigation will be handled automatically by the app state change
      }, 500);
    });
  }, [progress, fadeAnim, navigation]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={logoImage} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Loading Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View 
            style={[styles.progressBarFill, { width: progressWidth }]} 
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 30,
    paddingTop: Platform.OS === 'android' ? 50 : Platform.OS === 'web' ? 20 : 0,
    minHeight: Platform.OS === 'web' ? 1000 : undefined,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 60 : 40,
  },
  logoImage: {
    width: Platform.OS === 'android' ? 200 : Platform.OS === 'ios' ? 210 : Platform.OS === 'web' ? 240 : 220,
    height: Platform.OS === 'android' ? 100 : Platform.OS === 'ios' ? 105 : Platform.OS === 'web' ? 120 : 110,
    maxWidth: Platform.OS === 'web' ? 300 : undefined,
  },
  progressBarContainer: {
    width: Platform.OS === 'android' ? '85%' : Platform.OS === 'ios' ? '82%' : Platform.OS === 'web' ? '60%' : '80%',
    alignItems: 'center',
    maxWidth: Platform.OS === 'web' ? 400 : undefined,
  },
  progressBarBackground: {
    width: '100%',
    height: Platform.OS === 'android' ? 4 : Platform.OS === 'ios' ? 4.5 : Platform.OS === 'web' ? 6 : 5,
    backgroundColor: '#E5E5E5',
    borderRadius: Platform.OS === 'web' ? 3 : 2,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: APP_CONFIG.primaryColor,
    borderRadius: Platform.OS === 'web' ? 3 : 2,
  },
});
