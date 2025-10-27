import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistSearchBar,
  StylistButton,
  StylistFilterTab,
  StylistCard,
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';
import { useAuth } from '../../hooks/redux';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { cloudinaryService } from '../../services/cloudinaryService';

const { width } = Dimensions.get('window');

interface PortfolioItem {
  id: string;
  category: string;
  imageUrl: string;
  title: string;
  description?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export default function StylistPortfolioScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const categories = ['All', 'Haircut', 'Color', 'Styling', 'Treatment'];

  // Set up real-time subscription for portfolio items
  useEffect(() => {
    if (!user?.uid && !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const stylistId = user.uid || user.id;
    console.log('🔄 Setting up real-time subscription for portfolio items:', stylistId);

    const portfolioRef = collection(db, 'portfolio');
    const q = query(portfolioRef, where('stylistId', '==', stylistId));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        console.log('📡 Real-time portfolio update received:', querySnapshot.size, 'items');
        const items: PortfolioItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            category: data['category'] || 'Haircut',
            imageUrl: data['imageUrl'] || '',
            title: data['title'] || 'Untitled',
            description: data['description'] || '',
            createdAt: data['createdAt']?.toDate().toISOString() || new Date().toISOString(),
            status: data['status'] || 'pending',
            rejectionReason: data['rejectionReason'] || '',
          });
        });

        // Sort by creation date (newest first)
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        console.log('✅ Real-time portfolio items updated:', items.length);
        setPortfolioItems(items);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error processing portfolio update:', error);
        setPortfolioItems([]);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time portfolio listener error:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 Cleaning up portfolio subscription');
      unsubscribe();
    };
  }, [user?.uid, user?.id]);

  // Filter items by category, status and search
  const filteredItems = portfolioItems
    .filter(item => {
      // Filter by category
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      
      // Filter by status
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesStatus && matchesSearch;
    });

  // Calculate stats
  const stats = {
    all: portfolioItems.length,
    pending: portfolioItems.filter(i => i.status === 'pending').length,
    approved: portfolioItems.filter(i => i.status === 'approved').length,
    haircut: portfolioItems.filter(i => i.category === 'Haircut').length,
    color: portfolioItems.filter(i => i.category === 'Color').length,
    styling: portfolioItems.filter(i => i.category === 'Styling').length,
    treatment: portfolioItems.filter(i => i.category === 'Treatment').length,
  };

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        console.log('⚠️ Camera or library permissions not granted');
      }
    })();
  }, []);

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImageToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error picking image from library:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImageToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImageToCloudinary = async (imageUri: string) => {
    if (!user?.uid && !user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setUploading(true);

    try {
      console.log('📤 Uploading image to Cloudinary...');
      
      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadImage(imageUri, {
        folder: 'salon/portfolios',
        tags: [`stylist_${user.uid || user.id}`, 'portfolio'],
      });

      console.log('✅ Image uploaded to Cloudinary:', uploadResult.secureUrl);

      // Prompt for title and category
      Alert.prompt(
        'Add Details',
        'Enter a title for this work:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setUploading(false),
          },
          {
            text: 'Save',
            onPress: async (title) => {
              await saveToFirestore(uploadResult, title || 'Untitled');
            },
          },
        ],
        'plain-text',
        'My Amazing Work'
      );
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      setUploading(false);
    }
  };

  const saveToFirestore = async (uploadResult: any, title: string) => {
    try {
      const stylistId = user?.uid || user?.id;
      
      // Save to Firestore
      await addDoc(collection(db, 'portfolio'), {
        stylistId,
        imageUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        thumbnailUrl: uploadResult.thumbnailUrl,
        title: title || 'Untitled',
        category: 'Haircut', // Default category
        description: '',
        status: 'pending',
        width: uploadResult.width,
        height: uploadResult.height,
        createdAt: serverTimestamp(),
      });

      console.log('✅ Portfolio item saved to Firestore');
      Alert.alert(
        'Success!',
        'Your work has been uploaded and is pending approval from the branch manager.',
        [{ text: 'OK' }]
      );
      setUploading(false);
    } catch (error) {
      console.error('❌ Error saving to Firestore:', error);
      Alert.alert('Error', 'Failed to save portfolio item');
      setUploading(false);
    }
  };

  const handleUploadPhoto = () => {
    if (uploading) {
      Alert.alert('Please wait', 'Upload in progress...');
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImageFromLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Upload Photo',
        'Choose an option:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Take Photo',
            onPress: takePhoto,
          },
          {
            text: 'Choose from Library',
            onPress: pickImageFromLibrary,
          },
        ],
        { cancelable: true }
      );
    }
  };

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Search and Upload */}
        <View style={styles.galleryHeader}>
          <StylistSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Portfolio"
          />
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Gallery Grid */}
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#160B53" />
            <Text style={styles.emptyStateText}>Loading portfolio...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Portfolio Items</Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory === 'All' 
                ? 'Upload your first work to showcase your skills!' 
                : `No ${selectedCategory.toLowerCase()} items in your portfolio yet.`}
            </Text>
          </View>
        ) : (
          <View style={styles.galleryGrid}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.galleryCard}>
                <View style={styles.imageContainer}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
                  ) : (
                    <Ionicons name="image" size={60} color="#CCCCCC" />
                  )}
                </View>
                <View style={styles.galleryCardInfo}>
                  <Text style={styles.galleryCardTitle}>{item.title}</Text>
                  <View style={styles.galleryCardFooter}>
                    <Text style={styles.categoryTag}>{item.category}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Portfolio" userType="stylist" showBackButton={true}>
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <StylistSection style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {categories.map((category) => {
                const count = category === 'All' ? portfolioItems.length :
                             category === 'Haircut' ? stats.haircut :
                             category === 'Color' ? stats.color :
                             category === 'Styling' ? stats.styling :
                             category === 'Treatment' ? stats.treatment : 0;
                
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.quickFilterChip,
                      selectedCategory === category && styles.quickFilterChipActive,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.quickFilterText,
                        selectedCategory === category && styles.quickFilterTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                    {count > 0 && (
                      <View style={[
                        styles.quickFilterBadge,
                        selectedCategory === category && styles.quickFilterBadgeActive
                      ]}>
                        <Text style={[
                          styles.quickFilterBadgeText,
                          selectedCategory === category && styles.quickFilterBadgeTextActive
                        ]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </StylistSection>

        {/* Search and Filter */}
        <StylistSection>
          <View style={styles.searchSortRow}>
            <View style={styles.searchBarContainer}>
              <StylistSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search portfolio..."
              />
            </View>
            <View style={styles.sortButtons}>
              {/* Filter Dropdown Button */}
              <View style={styles.sortContainer}>
                <TouchableOpacity 
                  style={[styles.sortButton, sortDropdownVisible && styles.sortButtonActive]}
                  onPress={() => setSortDropdownVisible(!sortDropdownVisible)}
                >
                  <Ionicons 
                    name="swap-vertical" 
                    size={18} 
                    color={sortDropdownVisible ? '#FFFFFF' : '#6B7280'} 
                  />
                </TouchableOpacity>
                {/* Filter Dropdown Menu */}
                {sortDropdownVisible && (
                  <View style={styles.sortDropdown}>
                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, selectedStatus === 'all' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSelectedStatus('all');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="list-outline" 
                        size={18} 
                        color={selectedStatus === 'all' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, selectedStatus === 'all' && styles.sortDropdownTextActive]}>
                        All ({stats.all})
                      </Text>
                      {selectedStatus === 'all' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, selectedStatus === 'pending' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSelectedStatus('pending');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="time-outline" 
                        size={18} 
                        color={selectedStatus === 'pending' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, selectedStatus === 'pending' && styles.sortDropdownTextActive]}>
                        Pending ({stats.pending})
                      </Text>
                      {selectedStatus === 'pending' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, selectedStatus === 'approved' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSelectedStatus('approved');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="checkmark-circle-outline" 
                        size={18} 
                        color={selectedStatus === 'approved' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, selectedStatus === 'approved' && styles.sortDropdownTextActive]}>
                        Approved ({stats.approved})
                      </Text>
                      {selectedStatus === 'approved' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Portfolio Gallery */}
        <StylistSection>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.emptyStateText}>Loading portfolio...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="images" size={48} color="#EC4899" />
              </View>
              <Text style={styles.emptyStateTitle}>
                {selectedStatus === 'all' ? 'Start Your Portfolio!' : `No ${selectedStatus} Items`}
              </Text>
              <Text style={styles.emptyStateText}>
                {selectedStatus === 'all' 
                  ? 'Upload photos of your best work to showcase your skills and attract more clients.'
                  : `No ${selectedStatus} items found. Try changing your filter or upload new work!`}
              </Text>
              <TouchableOpacity 
                style={styles.uploadPromptButton}
                onPress={handleUploadPhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                    <Text style={styles.uploadPromptText}>Upload Your First Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.galleryGrid}>
              {filteredItems.map((item) => (
                <View key={item.id} style={styles.galleryCard}>
                  <View style={styles.imageContainer}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
                    ) : (
                      <Ionicons name="image" size={50} color="#CCCCCC" />
                    )}
                    {/* Status Badge */}
                    <View style={[
                      styles.statusBadge,
                      item.status === 'approved' ? styles.statusBadgeApproved : styles.statusBadgePending
                    ]}>
                      <Ionicons 
                        name={item.status === 'approved' ? 'checkmark-circle' : 'time'} 
                        size={14} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.statusBadgeText}>
                        {item.status === 'approved' ? 'Approved' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.galleryCardInfo}>
                    <Text style={styles.galleryCardTitle}>{item.title}</Text>
                    <View style={styles.galleryCardFooter}>
                      <Text style={styles.categoryTag}>{item.category}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </StylistSection>
      </ScrollView>
      
      {/* Floating Upload Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={handleUploadPhoto}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="add" size={32} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  categorySection: {
    marginTop: 0,
    marginBottom: 8,
  },
  searchSection: {
    marginTop: 0,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: '100%',
  },
  section: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: Platform.OS === 'web' ? 20 : 12,
    paddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 16 : 12,
  },
  titleSection: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: Platform.OS === 'web' ? 20 : 12,
    paddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 24 : 20,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryTitle: {
    fontSize: Platform.OS === 'web' ? 25 : 18,
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    borderRadius: 8,
    backgroundColor: '#160B53',
  },
  uploadButtonText: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#160B53',
    borderColor: '#160B53',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.OS === 'web' ? 16 : 12,
    justifyContent: Platform.OS === 'web' ? 'flex-start' : 'space-between',
  },
  galleryCard: {
    width: Platform.OS === 'web' ? '23%' : (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: Platform.OS === 'web' ? 200 : 180,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCardInfo: {
    padding: 12,
  },
  galleryCardTitle: {
    fontSize: 14,
    color: '#160B53',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  galleryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  categoryTag: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 20,
  },
  uploadPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#160B53',
    borderRadius: 8,
  },
  uploadPromptText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  // Scrollable Portfolio List (responsive to screen height)
  portfolioListScroll: {
    maxHeight: Dimensions.get('window').height * 0.5, // 50% of screen height
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APP_CONFIG.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Enhanced Stats Card (consistent with other pages)
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
  },
  totalBadge: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  totalBadgeText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
  // List Header (consistent with other pages)
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
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
  // Quick Filter Chips with Count Badges (consistent with other pages)
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickFilterChipActive: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  quickFilterText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#374151',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  quickFilterBadge: {
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFilterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickFilterBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: APP_CONFIG.primaryColor,
  },
  quickFilterBadgeTextActive: {
    color: '#FFFFFF',
  },
  // Pending Approval Styles
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#F59E0B',
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  pendingInfoText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#92400E',
    flex: 1,
  },
  // Search and Sort Styles
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 0,
  },
  sortContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonActive: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  sortDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 180,
    zIndex: 1001,
  },
  sortDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sortDropdownItemActive: {
    backgroundColor: '#F9FAFB',
  },
  sortDropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
  },
  sortDropdownTextActive: {
    color: '#160B53',
    fontFamily: 'Poppins_600SemiBold',
  },
  // Status Badge Styles
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeApproved: {
    backgroundColor: '#10B981',
  },
  statusBadgePending: {
    backgroundColor: '#F59E0B',
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  pendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pendingOverlayText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});
