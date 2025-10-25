import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, getDocs, collection, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const { user, logout, updateUserProfile } = useAuth();
  const [branchName, setBranchName] = useState<string>('Loading...');
  const [services, setServices] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Set up real-time subscription for branch name
  useEffect(() => {
    if (!user?.branchId) {
      setBranchName('Not assigned');
      return;
    }

    console.log('🔄 Setting up real-time subscription for branch:', user.branchId);
    const branchDocRef = doc(db, COLLECTIONS.BRANCHES, user.branchId);

    // Set up real-time listener
    const unsubscribe = onSnapshot(branchDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const branchData = docSnapshot.data();
        setBranchName(branchData['name'] || 'Unknown Branch');
        console.log('✅ Real-time branch update:', branchData['name']);
      } else {
        setBranchName('Branch not found');
        console.log('⚠️ Branch document not found for ID:', user.branchId);
      }
    }, (error) => {
      console.error('❌ Real-time branch listener error:', error);
      setBranchName('Error loading branch');
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 Cleaning up branch subscription');
      unsubscribe();
    };
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
    joinedDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
  };

  console.log('👤 Stylist Profile Data:', {
    userId: user?.id,
    name: stylistData.name,
    email: stylistData.email,
    phone: user?.phone,
    phoneFromData: stylistData.phone,
    branchId: user?.branchId,
    branchName: branchName,
    userType: user?.userType,
    roles: user?.roles
  });

  const handleUploadProfileImage = async () => {
    try {
      // Show options to user
      Alert.alert(
        'Upload Profile Photo',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: () => handleImagePick('camera'),
          },
          {
            text: 'Choose from Gallery',
            onPress: () => handleImagePick('gallery'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error showing image options:', error);
      Alert.alert('Error', 'Failed to show image options. Please try again.');
    }
  };

  const handleImagePick = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        // Request camera permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
          return;
        }

        // Launch camera
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        // Request gallery permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need gallery permissions to choose a photo.');
          return;
        }

        // Launch gallery
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setUploadingImage(true);
      const imageUri = result.assets[0].uri;

      // Upload to Firebase Storage
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `profile_images/${user?.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore
      if (user?.id) {
        await updateDoc(doc(db, COLLECTIONS.USERS, user.id), {
          profileImage: downloadURL,
        });

        // Update Redux and AsyncStorage
        const updatedUser = { ...user, profileImage: downloadURL };
        updateUserProfile(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

        Alert.alert('Success', 'Profile image updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Error', 'Failed to upload profile image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

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
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="#FFFFFF" />
            </View>
          </View>
          
          <Text style={styles.profileName}>{stylistData.name}</Text>
          <Text style={styles.profileRole}>Stylist</Text>
          
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
    <ScreenWrapper title="Profile" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card - Enhanced */}
        <StylistSection>
          <View style={styles.profileHeaderCard}>
            {/* Background Gradient */}
            <View style={styles.profileHeaderBackground}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    {user?.profileImage ? (
                      <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={48} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.editAvatarButton}
                    onPress={handleUploadProfileImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Profile Info */}
            <View style={styles.profileInfoSection}>
              <Text style={styles.profileName}>{stylistData.name}</Text>
              <View style={styles.profileRoleBadge}>
                <Ionicons name="cut" size={14} color={APP_CONFIG.primaryColor} />
                <Text style={styles.profileRole}>Professional Stylist</Text>
              </View>
              <View style={styles.profileMetaRow}>
                <View style={styles.profileMetaItem}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.profileMetaText}>{stylistData.branch}</Text>
                </View>
                <View style={styles.profileMetaItem}>
                  <Ionicons name="calendar" size={14} color="#6B7280" />
                  <Text style={styles.profileMetaText}>Joined {stylistData.joinedDate}</Text>
                </View>
              </View>
            </View>
            
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="people" size={20} color="#6366F1" />
                </View>
                <Text style={styles.statNumber}>{stylistData.totalClients}</Text>
                <Text style={styles.statLabel}>Total Clients</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="cash" size={20} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>₱{(user as any)?.totalEarnings || 0}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statNumber}>{stylistData.yearsOfExperience}</Text>
                <Text style={styles.statLabel}>Years Exp.</Text>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Information Section - Enhanced */}
        <StylistSection>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.infoCard}>
            
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

          </View>
        </StylistSection>

        {/* Services Section */}
        {services.length > 0 && (
          <StylistSection>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Specializations</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{services.length}</Text>
              </View>
            </View>
            <View style={styles.servicesGrid}>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceChip}>
                  <Ionicons name="checkmark-circle" size={16} color={APP_CONFIG.primaryColor} />
                  <Text style={styles.serviceChipText}>{service}</Text>
                </View>
              ))}
            </View>
            <View style={styles.servicesHint}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.servicesHintText}>
                These are the services you're qualified to provide
              </Text>
            </View>
          </StylistSection>
        )}

        {/* Quick Links */}
        <StylistSection>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
          </View>
          <View style={styles.quickLinksGrid}>
            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => (navigation as any).navigate('StylistClients')}
            >
              <View style={styles.quickLinkIcon}>
                <Ionicons name="people" size={24} color={APP_CONFIG.primaryColor} />
              </View>
              <Text style={styles.quickLinkTitle}>My Clients</Text>
              <Text style={styles.quickLinkSubtitle}>View & manage</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => (navigation as any).navigate('StylistPortfolio')}
            >
              <View style={styles.quickLinkIcon}>
                <Ionicons name="images" size={24} color={APP_CONFIG.primaryColor} />
              </View>
              <Text style={styles.quickLinkTitle}>Portfolio</Text>
              <Text style={styles.quickLinkSubtitle}>My work</Text>
            </TouchableOpacity>
          </View>
        </StylistSection>

        {/* Settings & Account */}
        <StylistSection>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings & Account</Text>
          </View>
          <View style={styles.optionsCard}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleEditProfile}
            >
              <View style={styles.optionLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name="person-outline" 
                    size={22} 
                    color={APP_CONFIG.primaryColor} 
                  />
                </View>
                <Text style={styles.optionTitle}>Edit Profile</Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleChangePassword}
            >
              <View style={styles.optionLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={22} 
                    color={APP_CONFIG.primaryColor} 
                  />
                </View>
                <Text style={styles.optionTitle}>Change Password</Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleNotificationSettings}
            >
              <View style={styles.optionLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name="notifications-outline" 
                    size={22} 
                    color={APP_CONFIG.primaryColor} 
                  />
                </View>
                <Text style={styles.optionTitle}>Notifications</Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.optionDivider} />

            {/* Logout */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleLogout}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.iconContainer, styles.iconContainerDestructive]}>
                  <Ionicons 
                    name="log-out-outline" 
                    size={22} 
                    color="#EF4444" 
                  />
                </View>
                <Text style={[styles.optionTitle, styles.optionTitleDestructive]}>
                  Logout
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
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
  profileSection: {
    marginTop: 16,
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
    flex: 1,
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
  profileRole: {
    fontSize: TYPOGRAPHY.body,
    color: '#666',
    fontFamily: FONTS.medium,
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
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: Platform.OS === 'web' ? 40 : 35,
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
    maxWidth: '100%',
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
    flexShrink: 1,
    maxWidth: '100%',
  },
  serviceTagText: {
    fontSize: TYPOGRAPHY.caption,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
    flexShrink: 1,
    // The following properties help prevent overflow on web while allowing wrapping
    // They are ignored on native platforms
    wordBreak: 'break-word' as any,
    overflowWrap: 'anywhere' as any,
  },
  // Enhanced Profile Header Styles
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeaderBackground: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingTop: 24,
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: APP_CONFIG.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  profileRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  profileMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  profileMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileMetaText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // Section Header (consistent with other pages)
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  countBadge: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceChipText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#160B53',
  },
  servicesHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  servicesHintText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FONTS.medium,
    flex: 1,
  },
  // Options Card
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  // Quick Links Grid
  quickLinksGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickLinkIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickLinkTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 4,
  },
  quickLinkSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
});
