import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { APP_CONFIG, FONTS } from '../../constants';
import { useAuth } from '../../hooks/redux';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { logout, isLoading } = useAuth();

  const handleProfile = () => {
    (navigation as any).navigate('StylistProfile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Starting logout process...');
              const result = await logout();
              console.log('🔄 Logout result:', result);
              
              if (result.type === 'auth/logout/fulfilled') {
                console.log('✅ Logout successful, app will redirect automatically');
              } else if (result.type === 'auth/logout/rejected') {
                console.log('❌ Logout failed:', result.payload);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      id: 1,
      title: 'Profile',
      icon: 'person-outline',
      onPress: handleProfile,
    },
    {
      id: 2,
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <ScreenWrapper title="Settings" showBackButton>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <View style={[
                  styles.iconContainer,
                  option.isDestructive && styles.iconContainerDestructive
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={option.isDestructive ? '#EF4444' : APP_CONFIG.primaryColor} 
                  />
                </View>
                <Text style={[
                  styles.optionTitle,
                  option.isDestructive && styles.optionTitleDestructive
                ]}>
                  {option.title}
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.semiBold,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerDestructive: {
    backgroundColor: '#FEE2E2',
  },
  optionTitle: {
    fontSize: 16,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  optionTitleDestructive: {
    color: '#EF4444',
  },
});
