import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
} from '../../components/stylist';
import { APP_CONFIG, FONTS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';
import { useAuth } from '../../hooks/redux';

export default function StylistProfileScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user, logout } = useAuth();
  const [branchName, setBranchName] = useState<string>('Loading...');
  const [services, setServices] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);

  // Fetch branch name from Firebase
  useEffect(() => {
    const fetchBranchName = async () => {
      if (!user?.branchId) {
        setBranchName('Not assigned');
        return;
      }

      try {
        const branchDoc = await getDoc(doc(db, COLLECTIONS.BRANCHES, user.branchId));
        if (branchDoc.exists()) {
          const branchData = branchDoc.data();
          setBranchName(branchData['name'] || 'Unknown Branch');
          console.log('✅ Branch loaded:', branchData['name']);
        } else {
          setBranchName('Branch not found');
          console.log('⚠️ Branch document not found for ID:', user.branchId);
        }
      } catch (error) {
        console.error('❌ Error fetching branch:', error);
        setBranchName('Error loading branch');
      }
    };

    fetchBranchName();
  }, [user?.branchId]);

  // Fetch stylist services from Firebase
  useEffect(() => {
    const fetchStylistServices = async () => {
      if (!user?.id) {
        setLoadingServices(false);
        return;
      }

      try {
        setLoadingServices(true);
        
        // Get stylist document to retrieve service IDs
        const stylistDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.id));
        
        if (!stylistDoc.exists()) {
          console.log('⚠️ Stylist document not found');
          setLoadingServices(false);
          return;
        }

        const stylistData = stylistDoc.data();
        const serviceIds = stylistData['service_id'] || [];
        
        console.log('📋 Stylist service IDs:', serviceIds);

        if (serviceIds.length === 0) {
          console.log('⚠️ No services assigned to stylist');
          setServices([]);
          setLoadingServices(false);
          return;
        }

        // Fetch service names from services collection
        const serviceNames: string[] = [];
        
        for (const serviceId of serviceIds) {
          try {
            const serviceDoc = await getDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
            if (serviceDoc.exists()) {
              const serviceData = serviceDoc.data();
              serviceNames.push(serviceData['name'] || 'Unknown Service');
              console.log('✅ Service loaded:', serviceData['name']);
            } else {
              console.log('⚠️ Service not found for ID:', serviceId);
            }
          } catch (error) {
            console.error('❌ Error fetching service:', serviceId, error);
          }
        }

        setServices(serviceNames);
        console.log('✅ All services loaded:', serviceNames);
      } catch (error) {
        console.error('❌ Error fetching stylist services:', error);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchStylistServices();
  }, [user?.id]);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Get real stylist data from Firebase
  const stylistData = {
    name: user ? `${user.firstName} ${user.lastName}` : 'Stylist',
    email: user?.email || '',
    phone: user?.phone || 'Not set',
    branch: branchName,
    specialization: (user as any)?.specialization?.join(', ') || 'General',
    yearsOfExperience: (user as any)?.experience || 0,
    totalClients: (user as any)?.totalClients || 0,
    rating: (user as any)?.rating || 0,
    joinedDate: user?.memberSince ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
  };

  console.log('👤 Stylist Profile Data:', {
    userId: user?.id,
    name: stylistData.name,
    email: stylistData.email,
    branchId: user?.branchId,
    branchName: branchName,
    userType: user?.userType,
    roles: user?.roles
  });

  const handleEditProfile = () => {
    (navigation as any).navigate('StylistEditProfile');
  };

  const handleChangePassword = () => {
    (navigation as any).navigate('StylistChangePassword');
  };

  const handleNotificationSettings = () => {
    Alert.alert('Notifications', 'Notification settings coming soon');
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
              await logout();
              console.log('✅ User logged out successfully');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const profileOptions = [
    {
      id: 1,
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: handleEditProfile,
    },
    {
      id: 2,
      title: 'Change Password',
      icon: 'lock-closed-outline',
      onPress: handleChangePassword,
    },
    {
      id: 3,
      title: 'Notification Settings',
      icon: 'notifications-outline',
      onPress: handleNotificationSettings,
    },
    {
      id: 4,
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  // For web, render without ScreenWrapper
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Text style={styles.webTitle}>My Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="#FFFFFF" />
            </View>
          </View>
          
          <Text style={styles.profileName}>{stylistData.name}</Text>
          
          {/* Services Tags */}
          {loadingServices ? (
            <Text style={styles.servicesLoading}>Loading services...</Text>
          ) : services.length > 0 ? (
            <View style={styles.servicesContainer}>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#160B53" />
                  <Text style={styles.serviceTagText}>{service}</Text>
                </View>
              ))}
            </View>
          ) : null}
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stylistData.totalClients}</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stylistData.yearsOfExperience}</Text>
              <Text style={styles.statLabel}>Years Exp.</Text>
            </View>
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{stylistData.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{stylistData.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Branch</Text>
              <Text style={styles.infoValue}>{stylistData.branch}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{stylistData.joinedDate}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {profileOptions.map((option) => (
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
      </View>
    );
  }

  // For mobile, use ScreenWrapper
  return (
    <ScreenWrapper title="Profile" showBackButton userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <StylistSection isTitle>
          <StylistPageTitle title="My Profile" />
        </StylistSection>

        {/* Profile Header Card */}
        <StylistSection>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <View style={styles.avatarGradient}>
                    <Ionicons name="person" size={40} color="#FFFFFF" />
                  </View>
                </View>
                <TouchableOpacity style={styles.editAvatarButton}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{stylistData.name}</Text>
                
                {/* Services Tags */}
                {loadingServices ? (
                  <Text style={styles.servicesLoading}>Loading services...</Text>
                ) : services.length > 0 ? (
                  <View style={styles.servicesContainer}>
                    {services.map((service, index) => (
                      <View key={index} style={styles.serviceTag}>
                        <Ionicons name="checkmark-circle" size={12} color="#160B53" />
                        <Text style={styles.serviceTagText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="people" size={18} color="#160B53" />
                </View>
                <Text style={styles.statNumber}>{stylistData.totalClients}</Text>
                <Text style={styles.statLabel}>Clients</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="checkmark-circle" size={18} color="#160B53" />
                </View>
                <Text style={styles.statNumber}>{(user as any)?.totalEarnings || 0}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="time" size={18} color="#160B53" />
                </View>
                <Text style={styles.statNumber}>{stylistData.yearsOfExperience}</Text>
                <Text style={styles.statLabel}>Years</Text>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Information Section */}
        <StylistSection>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#160B53" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{stylistData.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{stylistData.phone}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Branch Location</Text>
                <Text style={styles.infoValue}>{stylistData.branch}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Joined Date</Text>
                <Text style={styles.infoValue}>{stylistData.joinedDate}</Text>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Settings Section */}
        <StylistSection>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={20} color="#160B53" />
              <Text style={styles.sectionTitle}>Account Settings</Text>
            </View>
            
            {profileOptions.map((option, index) => (
              <View key={option.id}>
                <TouchableOpacity
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
                        size={22} 
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
              </View>
            ))}
          </View>
        </StylistSection>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    minHeight: '100%',
  },
  webTitle: {
    fontSize: TYPOGRAPHY.h2,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.lg,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: Platform.OS === 'web' ? 80 : 70,
    height: Platform.OS === 'web' ? 80 : 70,
    borderRadius: Platform.OS === 'web' ? 40 : 35,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#160B53',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarGradient: {
    width: Platform.OS === 'web' ? 80 : 70,
    height: Platform.OS === 'web' ? 80 : 70,
    borderRadius: Platform.OS === 'web' ? 40 : 35,
    backgroundColor: '#160B53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#160B53',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: TYPOGRAPHY.h3,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  specializationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    alignSelf: 'flex-start',
  },
  profileSpecialization: {
    fontSize: TYPOGRAPHY.label,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.h4,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: '#6B7280',
    fontFamily: FONTS.medium,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.label,
    color: '#160B53',
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.label,
    color: '#9CA3AF',
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
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
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  optionTitleDestructive: {
    color: '#EF4444',
  },
  servicesLoading: {
    fontSize: TYPOGRAPHY.caption,
    color: '#9CA3AF',
    fontFamily: FONTS.medium,
    marginTop: SPACING.xs,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs - 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  serviceTagText: {
    fontSize: TYPOGRAPHY.caption,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
});
