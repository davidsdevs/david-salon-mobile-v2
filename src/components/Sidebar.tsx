import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  currentScreen: string;
}

export default function Sidebar({ isVisible, onClose, onNavigate, currentScreen }: SidebarProps) {
  if (!isVisible) return null;

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'grid-outline', isActive: currentScreen === 'dashboard' },
    { id: 'appointments', title: 'Appointments', icon: 'calendar-outline', isActive: currentScreen === 'appointments' },
    { id: 'products', title: 'Products', icon: 'bag-outline', isActive: currentScreen === 'products' },
    { id: 'rewards', title: 'Rewards', icon: 'gift-outline', isActive: currentScreen === 'rewards' },
    { id: 'profile', title: 'Profile', icon: 'person-outline' },
    { id: 'settings', title: 'Settings', icon: 'settings-outline' },
  ];

  return (
    <View style={styles.overlay}>
      <View style={styles.sidebar}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#160B53" />
          </TouchableOpacity>
        </View>

        {/* User Profile */}
        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={40} color="#160B53" />
          </View>
          <Text style={styles.userName}>Claire Cruz</Text>
          <Text style={styles.memberSince}>Member since 2022</Text>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>Gold Member</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.isActive && styles.activeMenuItem
              ]}
              onPress={() => onNavigate(item.id)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={20} 
                color={item.isActive ? '#FFFFFF' : '#160B53'} 
              />
              <Text style={[
                styles.menuText,
                item.isActive && styles.activeMenuText
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.5,
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingTop: isIPhone ? 60 : 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logoContainer: {
    alignItems: 'flex-start',
    flex: 1,
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  closeButton: {
    padding: 5,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#160B53',
    marginBottom: 4,
    fontFamily: 'Poppins_700Bold',
  },
  memberSince: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  membershipBadge: {
    backgroundColor: '#160B53',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  membershipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  menuContainer: {
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 3,
  },
  activeMenuItem: {
    backgroundColor: '#160B53',
  },
  menuText: {
    fontSize: 15,
    color: '#160B53',
    marginLeft: 12,
    fontFamily: 'Poppins_400Regular',
  },
  activeMenuText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
});
