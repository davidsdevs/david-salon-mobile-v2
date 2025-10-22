import React from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StylistTabParamList } from '../types';
import SidebarWithHeader from './SidebarWithHeader';

interface StylistResponsiveLayoutProps {
  children: React.ReactNode;
  currentScreen: keyof StylistTabParamList;
}

const isWeb = Platform.OS === 'web';

export default function StylistResponsiveLayout({ children, currentScreen }: StylistResponsiveLayoutProps) {
  const getPageTitle = (screen: keyof StylistTabParamList) => {
    const titles = {
      StylistDashboard: 'Dashboard',
      StylistAppointments: 'Appointments',
      StylistClients: 'Clients',
      StylistSchedule: 'Schedule',
      StylistPortfolio: 'Portfolio',
    };
    return titles[screen] || 'Dashboard';
  };

  // User info for the sidebar - stylist specific
  const userInfo = {
    name: "Maria Santos",
    subtitle: "Stylist",
    profileImage: undefined, // Will use default logo
    badge: undefined
  };

  if (isWeb) {
    // Web Layout with Sidebar (matching salon-management-system exactly)
    return (
      <SidebarWithHeader
        userInfo={userInfo}
        pageTitle={getPageTitle(currentScreen)}
        currentScreen={currentScreen}
        userType="stylist"
      >
        {children}
      </SidebarWithHeader>
    );
  }

  // Mobile Layout - just return children (bottom nav handled by StylistTabNavigator)
  return <>{children}</>;
}
