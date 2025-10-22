import React from 'react';
import { Platform, View, Text, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_CONFIG, FONTS } from '../../constants';
import { StylistTabParamList } from '../../types';

// Import stylist screens
import StylistDashboardScreen from '../../screens/stylist/StylistDashboardScreen';
import StylistAppointmentsScreen from '../../screens/stylist/StylistAppointmentsScreen';
import StylistClientsScreen from '../../screens/stylist/StylistClientsScreen';
import StylistScheduleScreen from '../../screens/stylist/StylistScheduleScreen';
import StylistPortfolioScreen from '../../screens/stylist/StylistPortfolioScreen';

const Tab = createBottomTabNavigator<StylistTabParamList>();

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;
const isWeb = Platform.OS === 'web';

// Custom Tab Icon Component
const TabIcon = ({ 
  focused, 
  iconName 
}: { 
  focused: boolean; 
  iconName: string; 
}) => {
  const getIconName = () => {
    const iconMap = {
      home: focused ? 'home' : 'home-outline',
      calendar: focused ? 'calendar' : 'calendar-outline',
      people: focused ? 'people' : 'people-outline',
      time: focused ? 'time' : 'time-outline',
      portfolio: focused ? 'images' : 'images-outline',
    };
    return iconMap[iconName as keyof typeof iconMap] || 'home-outline';
  };

  // Special sizing for home button on mobile
  const isHomeButton = iconName === 'home' && !isWeb;
  const iconSize = isHomeButton 
    ? (isTablet ? 40 : isSmallScreen ? 34 : 36) // Bigger for home
    : (isTablet ? 32 : isSmallScreen ? 26 : 28);
  const containerSize = isHomeButton 
    ? (isTablet ? 32 : isSmallScreen ? 28 : 30) // Much bigger container for home
    : (isTablet ? 24 : isSmallScreen ? 20 : 22);

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    }}>
      <View 
        style={{
          width: containerSize * 2,
          height: containerSize * 2,
          borderRadius: containerSize,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isHomeButton 
            ? (focused ? APP_CONFIG.primaryColor : '#F3F4F6') // Always show background for home
            : (focused ? APP_CONFIG.primaryColor : 'transparent'),
          shadowColor: isHomeButton 
            ? (focused ? APP_CONFIG.primaryColor : '#9CA3AF') // Always show shadow for home
            : (focused ? APP_CONFIG.primaryColor : 'transparent'),
          shadowOffset: { width: 0, height: isHomeButton ? 8 : 3 }, // Enhanced shadow for floating effect
          shadowOpacity: isHomeButton ? 0.6 : 0.3, // Stronger shadow opacity
          shadowRadius: isHomeButton ? 12 : 6, // Larger shadow radius
          elevation: isHomeButton ? 12 : (focused ? 6 : 0), // Higher elevation
          borderWidth: isHomeButton && !focused ? 1 : 0,
          borderColor: isHomeButton && !focused ? '#E5E7EB' : 'transparent',
          marginTop: isHomeButton ? -20 : 0, // Move home button much higher for floating effect
        }}
      >
        <Ionicons 
          name={getIconName() as any}
          size={iconSize} 
          color={isHomeButton 
            ? (focused ? '#FFFFFF' : APP_CONFIG.primaryColor) // Different color for home
            : (focused ? '#FFFFFF' : '#64748B')
          } 
        />
      </View>
    </View>
  );
};

export default function StylistTabNavigator() {
  const insets = useSafeAreaInsets();
  
  // Calculate proper tab bar height with safe area
  const baseTabHeight = isWeb ? 70 : (isTablet ? 60 : 50);
  const tabBarHeight = isWeb ? baseTabHeight : baseTabHeight + insets.bottom;
  
  // Calculate padding with safe area
  const paddingBottom = isWeb ? 12 : insets.bottom + (isTablet ? 8 : 6);
  const paddingTop = isWeb ? 12 : (isTablet ? 12 : 8);
  const paddingHorizontal = isWeb ? 40 : (isTablet ? 30 : 20);

  return (
    <Tab.Navigator
      initialRouteName="StylistDashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: isWeb ? { display: 'none' } : {
          backgroundColor: APP_CONFIG.surfaceColor,
          height: tabBarHeight,
          paddingBottom: paddingBottom,
          paddingTop: paddingTop,
          paddingHorizontal: paddingHorizontal,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          borderTopLeftRadius: isWeb ? 0 : 20,
          borderTopRightRadius: isWeb ? 0 : 20,
          maxWidth: isWeb ? 1200 : undefined,
          alignSelf: isWeb ? 'center' : undefined,
          marginHorizontal: isWeb ? 'auto' : undefined,
          justifyContent: 'space-around',
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: APP_CONFIG.primaryColor,
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen 
        name="StylistAppointments" 
        component={StylistAppointmentsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              iconName="calendar" 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="StylistClients" 
        component={StylistClientsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              iconName="people" 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="StylistDashboard" 
        component={StylistDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              iconName="home" 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="StylistSchedule" 
        component={StylistScheduleScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              iconName="time" 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="StylistPortfolio" 
        component={StylistPortfolioScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              iconName="portfolio" 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
