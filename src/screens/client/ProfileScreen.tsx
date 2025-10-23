import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../hooks/redux';
import { APP_CONFIG, FONTS } from '../../constants';
import clearAllAppData from '../../utils/clearAllData';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? This will clear all your data.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              console.log('🔄 Starting complete logout process...');
              
              // Clear all app data using utility function
              await clearAllAppData();
              
              // Perform Redux logout
              const result = await logout();
              console.log('🔄 Logout result:', result);
              
              if (result.type === 'auth/logout/fulfilled') {
                console.log('✅ Complete logout successful, all data cleared');
              } else if (result.type === 'auth/logout/rejected') {
                console.log('❌ Logout failed:', result.payload);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };


  const profileOptions = [
    {
      id: 1,
      title: 'Edit Profile',
      icon: 'settings-outline',
      onPress: () => console.log('Edit Profile'),
    },
    {
      id: 2,
      title: 'Notification Settings',
      icon: 'notifications-outline',
      onPress: () => console.log('Notification Settings'),
    },
    {
      id: 3,
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => console.log('Help & Support'),
    },
    {
      id: 4,
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => console.log('About'),
    },
  ];

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={APP_CONFIG.primaryColor} />
          </View>
          <Text style={styles.userName}>{user?.name || 'Claire Cruz'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'claire@example.com'}</Text>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>{user?.membershipLevel || 'Gold'} Member</Text>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <Ionicons name={option.icon as any} size={20} color={APP_CONFIG.primaryColor} />
                <Text style={styles.optionText}>{option.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={APP_CONFIG.lightTextColor} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]} 
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Ionicons name="log-out" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Profile">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={APP_CONFIG.primaryColor} />
          </View>
          <Text style={styles.userName}>{user?.name || 'Claire Cruz'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'claire@example.com'}</Text>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>{user?.membershipLevel || 'Gold'} Member</Text>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <Ionicons name={option.icon as any} size={20} color={APP_CONFIG.primaryColor} />
                <Text style={styles.optionText}>{option.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={APP_CONFIG.lightTextColor} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]} 
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Ionicons name="log-out" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 30 : 20,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: '100%',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 20 : Platform.OS === 'ios' ? 22 : 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: Platform.OS === 'web' ? 18 : Platform.OS === 'android' ? 20 : Platform.OS === 'ios' ? 22 : 24,
    color: Platform.OS === 'web' ? 'rgb(17, 24, 39)' : APP_CONFIG.primaryColor,
    marginBottom: Platform.OS === 'web' ? 12 : 4,
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : FONTS.bold,
  },
  userEmail: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: APP_CONFIG.lightTextColor,
    marginBottom: 12,
    fontFamily: FONTS.regular,
  },
  membershipBadge: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  membershipText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    fontFamily: FONTS.bold,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'web' ? 16 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: APP_CONFIG.primaryColor,
    marginLeft: 12,
    fontFamily: FONTS.medium,
  },
  logoutButton: {
    backgroundColor: '#FF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'web' ? 16 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 16 : 14,
    marginLeft: 8,
    fontFamily: FONTS.semiBold,
  },
  logoutButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
});
