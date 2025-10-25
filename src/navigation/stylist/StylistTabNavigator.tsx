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
import StylistScheduleScreen from '../../screens/stylist/StylistScheduleScreen';
import StylistEarningsScreen from '../../screens/stylist/StylistEarningsScreen';
import StylistProfileScreen from '../../screens/stylist/StylistProfileScreen';

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
      schedule: focused ? 'time' : 'time-outline',
      earnings: focused ? 'wallet' : 'wallet-outline',
      profile: focused ? 'person' : 'person-outline',
    };
    return iconMap[iconName as keyof typeof iconMap] || 'home-outline';
  };

  // Consistent icon sizing for all tabs
  const iconSize = isTablet ? 32 : isSmallScreen ? 26 : 28;
  const containerSize = isTablet ? 24 : isSmallScreen ? 20 : 22;

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
          backgroundColor: focused ? APP_CONFIG.primaryColor : 'transparent',
          shadowColor: focused ? APP_CONFIG.primaryColor : 'transparent',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: focused ? 6 : 0,
        }}
      >
        <Ionicons 
          name={getIconName() as any}
          size={iconSize} 
          color={focused ? '#FFFFFF' : '#64748B'} 
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
        name="StylistSchedule" 
        component={StylistScheduleScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              iconName="schedule" 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="StylistEarnings" 
        component={StylistEarningsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              iconName="earnings" 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="StylistProfile" 
        component={StylistProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              iconName="profile" 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
