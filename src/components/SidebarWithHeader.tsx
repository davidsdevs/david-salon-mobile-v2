import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Dimensions, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RemixIcon from 'react-native-remix-icon';
import { APP_CONFIG, FONTS } from '../constants';
import { MainTabParamList, StylistTabParamList } from '../types';
import { useAuth } from '../hooks/redux';

interface SidebarWithHeaderProps {
  userInfo: {
    name: string;
    subtitle: string;
    profileImage?: string | undefined;
    badge?: string | undefined;
  };
  pageTitle: string;
  children: React.ReactNode;
  currentScreen: keyof MainTabParamList | keyof StylistTabParamList;
  userType?: 'client' | 'stylist';
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isWeb = Platform.OS === 'web';

const SidebarWithHeader = ({ userInfo, pageTitle, children, currentScreen, userType = 'client' }: SidebarWithHeaderProps) => {
  const navigation = useNavigation();
  const { logout, isLoading } = useAuth();

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  const clientMenuItems = [
    { name: "Dashboard", icon: "dashboard-line" as any, route: "Dashboard" as keyof MainTabParamList },
    { name: "Appointments", icon: "calendar-line" as any, route: "Appointments" as keyof MainTabParamList },
    { name: "Products", icon: "shopping-bag-line" as any, route: "Products" as keyof MainTabParamList },
    { name: "Rewards", icon: "gift-line" as any, route: "Rewards" as keyof MainTabParamList },
    { name: "Profile", icon: "user-line" as any, route: "Profile" as keyof MainTabParamList }
  ];

  const stylistMenuItems = [
    { name: "Dashboard", icon: "dashboard-line" as any, route: "StylistDashboard" as keyof StylistTabParamList },
    { name: "Appointments", icon: "calendar" as any, route: "StylistSchedule" as keyof StylistTabParamList },
    { name: "Clients", icon: "user-line" as any, route: "StylistClients" as keyof StylistTabParamList },
    { name: "Schedule", icon: "time-line" as any, route: "StylistEarnings" as keyof StylistTabParamList },
    { name: "Portfolio", icon: "image-line" as any, route: "StylistProfile" as keyof StylistTabParamList }
  ];

  const menuItems = userType === 'stylist' ? stylistMenuItems : clientMenuItems;

  const specialMenuItems: any[] = [];

  const bottomMenuItems = [
    { name: "Notifications", icon: "notification-3-line" as any, route: "Notifications" as any },
    { name: "Settings", icon: "settings-line" as any, route: "Settings" as any }
  ];

  const handleMenuItemClick = (route: keyof MainTabParamList | keyof StylistTabParamList) => {
    if (isWeb) {
      (navigation as any).navigate('MainTabs', { screen: route });
    } else {
      (navigation as any).navigate(route);
    }
  };

  const handleSpecialMenuItemClick = (route: string) => {
    console.log(`${route} clicked`);
  };

  const handleBottomMenuItemClick = (route: string) => {
    if (route === 'Notifications') {
      // Navigate to notification screen based on user type
      const notificationRoute = userType === 'stylist' ? 'StylistNotifications' : 'Notifications';
      (navigation as any).navigate(notificationRoute);
    } else if (route === 'Settings') {
      (navigation as any).navigate('Settings');
    }
  };

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

  if (!isWeb) {
    // For mobile, just return children with a simple header
    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileHeader}>
          <Text style={styles.mobilePageTitle}>{pageTitle}</Text>
          <Text style={styles.mobilePageDate}>{getCurrentDate()}</Text>
        </View>
        <ScrollView 
          style={styles.mobileScrollView}
          contentContainerStyle={styles.mobileContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.webContainer}>
      {/* Sidebar - Always visible on web */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarContent}>
          {/* Sidebar Header */}
          <View style={styles.sidebarHeader}>
            {/* Logo */}
            <View style={styles.sidebarLogoContainer}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.sidebarLogo}
                resizeMode="contain"
              />
            </View>

            {/* User Profile */}
            <View style={styles.sidebarUserProfile}>
              <View style={styles.sidebarUserAvatar}>
                <Image
                  source={userInfo.profileImage ? { uri: userInfo.profileImage } : require('../../assets/logo.png')}
                  style={styles.sidebarUserImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.sidebarUserInfo}>
                <Text style={styles.sidebarUserName}>{userInfo.name}</Text>
                <Text style={styles.sidebarUserSubtitle}>{userInfo.subtitle}</Text>
                {userInfo.badge && (
                  <View style={styles.sidebarUserBadge}>
                    <Text style={styles.sidebarUserBadgeText}>{userInfo.badge}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Sidebar Content */}
          <View style={styles.sidebarNavigation}>
            <View style={styles.sidebarNavContent}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => handleMenuItemClick(item.route)}
                  style={[
                    styles.sidebarNavItem,
                    currentScreen === item.route && styles.sidebarNavItemActive
                  ]}
                >
                  <RemixIcon
                    name={item.icon}
                    size={20}
                    color={currentScreen === item.route ? '#FFFFFF' : '#374151'}
                    style={styles.sidebarNavIcon}
                  />
                  <Text style={[
                    styles.sidebarNavLabel,
                    currentScreen === item.route && styles.sidebarNavLabelActive
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Menu Items */}
          <View style={styles.sidebarSpecial}>
            <View style={styles.sidebarSpecialContent}>
              {specialMenuItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => handleSpecialMenuItemClick(item.route)}
                  style={[
                    styles.sidebarSpecialItem,
                    currentScreen === item.route && styles.sidebarSpecialItemActive
                  ]}
                >
                  <RemixIcon
                    name={item.icon}
                    size={20}
                    color={currentScreen === item.route ? '#160B53' : '#6B7280'}
                    style={styles.sidebarNavIcon}
                  />
                  <Text style={[
                    styles.sidebarSpecialLabel,
                    currentScreen === item.route && styles.sidebarSpecialLabelActive
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom Menu Items */}
          <View style={styles.sidebarBottom}>
            <View style={styles.sidebarBottomContent}>
              {bottomMenuItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => handleBottomMenuItemClick(item.route)}
                  style={styles.sidebarBottomItem}
                >
                  <RemixIcon
                    name={item.icon}
                    size={20}
                    color="#6B7280"
                    style={styles.sidebarNavIcon}
                  />
                  <Text style={styles.sidebarBottomLabel}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.webMainContent}>
        {/* Top Header */}
        <View style={styles.webHeader}>
          <View style={styles.webHeaderContent}>
            {/* Page Title and Date */}
            <View style={styles.webHeaderLeft}>
              <Text style={styles.webPageTitle}>{pageTitle}</Text>
              <Text style={styles.webPageDate}>{getCurrentDate()}</Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.webLogoutButton}
            >
              <RemixIcon name="logout-box-line" as any size={16} color="#6B7280" />
              <Text style={styles.webLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.webMainContentArea}>
          <ScrollView 
            style={styles.webScrollView}
            contentContainerStyle={styles.webScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.webContentContainer}>
              {children}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Mobile styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mobileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mobilePageTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 2,
  },
  mobilePageDate: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
  mobileScrollView: {
    flex: 1,
  },
  mobileContent: {
    padding: 16,
  },

  // Web styles
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    height: '100vh' as any,
  },
  sidebar: {
    width: 256, // w-64
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarContent: {
    flex: 1,
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: 24, // p-6
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarLogoContainer: {
    alignItems: 'flex-start',
    marginBottom: 24, // mb-6
    marginLeft: -24, // Pull logo to the left edge
    paddingLeft: 0,
  },
  sidebarLogo: {
    width: 120,
    height: 40,
  } as any,
  sidebarUserProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // space-x-3
  },
  sidebarUserAvatar: {
    width: 48, // w-12
    height: 48, // h-12
    borderRadius: 24, // rounded-full
    backgroundColor: '#D1D5DB', // bg-gray-300
  },
  sidebarUserImage: {
    width: '100%',
    height: '100%',
  } as any,
  sidebarUserInfo: {
    flex: 1,
  },
  sidebarUserName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#111827', // text-gray-900
    marginBottom: 2,
  },
  sidebarUserSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280', // text-gray-500
    marginBottom: 4,
  },
  sidebarUserBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#160B53',
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    borderRadius: 12, // rounded-full
  },
  sidebarUserBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  sidebarNavigation: {
    flex: 1,
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
  },
  sidebarNavContent: {
    // No gap since we're using marginBottom on items
  },
  sidebarNavItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    borderRadius: 8, // rounded-lg
    marginBottom: 4, // space-y-1
  },
  sidebarNavItemActive: {
    backgroundColor: '#160B53',
  },
  sidebarNavIcon: {
    marginRight: 12, // mr-3
  },
  sidebarNavLabel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#374151', // text-gray-700
  },
  sidebarNavLabelActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
  },
  sidebarSpecial: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sidebarSpecialContent: {
    // No gap since we're using marginBottom on items
  },
  sidebarSpecialItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    borderRadius: 8, // rounded-lg
    marginBottom: 4, // space-y-1
  },
  sidebarSpecialLabel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#6B7280', // text-gray-500
  },
  sidebarSpecialItemActive: {
    backgroundColor: '#F3F4F6',
  },
  sidebarSpecialLabelActive: {
    color: '#160B53',
    fontFamily: FONTS.medium,
  },
  sidebarBottom: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sidebarBottomContent: {
    // No gap since we're using marginBottom on items
  },
  sidebarBottomItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    borderRadius: 8, // rounded-lg
    marginBottom: 4, // space-y-1
  },
  sidebarBottomLabel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#6B7280', // text-gray-500
  },
  webMainContent: {
    flex: 1,
    flexDirection: 'column',
    height: '100vh' as any,
    overflow: 'hidden',
  },
  webHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16, // px-4
    paddingVertical: 16, // py-4
  },
  webHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webHeaderLeft: {
    flex: 1,
  },
  webPageTitle: {
    fontSize: 24, // text-2xl
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 2,
  },
  webPageDate: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#6B7280', // text-gray-600
  },
  webLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // space-x-2
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
  },
  webLogoutText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
  webMainContentArea: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  webScrollView: {
    flex: 1,
    height: '100%',
  },
  webScrollContent: {
    padding: 16, // p-4 on mobile
    // For larger screens, we'll use 24px (p-6) - this would need to be handled with responsive design
  },
  webContentContainer: {
    maxWidth: 1280, // max-w-7xl (1280px)
    alignSelf: 'center',
    width: '100%',
    minHeight: '100%',
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
    lineHeight: 12,
  },
});

export default SidebarWithHeader;
