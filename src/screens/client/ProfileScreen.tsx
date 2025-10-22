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
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../hooks/redux';
import { APP_CONFIG, FONTS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
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
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? 30 : 20,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxl,
    minHeight: '100%',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
    marginBottom: SPACING.lg,
  },
  userName: {
    fontSize: TYPOGRAPHY.h2,
    color: APP_CONFIG.primaryColor,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.bold,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.body,
    color: APP_CONFIG.lightTextColor,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  membershipBadge: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
  },
  membershipText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.label,
    fontFamily: FONTS.bold,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
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
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: TYPOGRAPHY.body,
    color: APP_CONFIG.primaryColor,
    marginLeft: SPACING.md,
    fontFamily: FONTS.medium,
  },
  logoutButton: {
    backgroundColor: '#FF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xl,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.body,
    marginLeft: SPACING.sm,
    fontFamily: FONTS.semiBold,
  },
  logoutButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
});
