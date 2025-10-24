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
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';

const { width } = Dimensions.get('window');

interface PortfolioItem {
  id: string;
  category: string;
  imageUrl: string;
  title: string;
  description?: string;
  createdAt: string;
}

export default function StylistPortfolioScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const filteredItems = portfolioItems
    .filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

  const handleUploadPhoto = () => {
    console.log('Upload photo');
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
    <ScreenWrapper title="Portfolio" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <StylistSection style={styles.searchSection}>
          <StylistSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Portfolio"
          />
        </StylistSection>

        {/* Category Filter */}
        <StylistSection style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
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
            </View>
          </ScrollView>
        </StylistSection>

        {/* Gallery Grid */}
        <StylistSection>
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
                      <Ionicons name="image" size={50} color="#CCCCCC" />
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
        </StylistSection>
      </ScrollView>
      
      {/* Floating Upload Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={handleUploadPhoto}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchSection: {
    marginTop: 16,
  },
  categorySection: {
    marginTop: -12,
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
    gap: 8,
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
  emptyStateTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
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
});
