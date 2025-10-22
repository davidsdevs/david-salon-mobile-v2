import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistButton,
  StylistFilterTab,
  StylistCard,
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';

const { width } = Dimensions.get('window');

export default function StylistPortfolioScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const categories = ['All', 'Haircut', 'Color', 'Styling', 'Treatment'];

  const galleryItems = [
    {
      id: 1,
      category: 'Color',
      imageUrl: 'https://via.placeholder.com/300x400',
      title: 'Balayage Highlights',
      likes: 45,
    },
    {
      id: 2,
      category: 'Haircut',
      imageUrl: 'https://via.placeholder.com/300x400',
      title: 'Layered Bob',
      likes: 32,
    },
    {
      id: 3,
      category: 'Styling',
      imageUrl: 'https://via.placeholder.com/300x400',
      title: 'Bridal Updo',
      likes: 58,
    },
    {
      id: 4,
      category: 'Color',
      imageUrl: 'https://via.placeholder.com/300x400',
      title: 'Platinum Blonde',
      likes: 67,
    },
    {
      id: 5,
      category: 'Treatment',
      imageUrl: 'https://via.placeholder.com/300x400',
      title: 'Keratin Treatment',
      likes: 28,
    },
    {
      id: 6,
      category: 'Haircut',
      imageUrl: 'https://via.placeholder.com/300x400',
      title: 'Pixie Cut',
      likes: 41,
    },
  ];

  const filteredItems = selectedCategory === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  const handleUploadPhoto = () => {
    console.log('Upload photo');
  };

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Gallery Header */}
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>My Portfolio</Text>
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
        <View style={styles.galleryGrid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.galleryCard}>
              <View style={styles.imageContainer}>
                <Ionicons name="image" size={60} color="#CCCCCC" />
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
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Portfolio" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Gallery Header */}
        <StylistSection isTitle>
          <View style={styles.headerRow}>
            <StylistPageTitle title="My Portfolio" />
            <StylistButton
              title="Upload"
              onPress={handleUploadPhoto}
              variant="primary"
              icon="add-circle-outline"
            />
          </View>
        </StylistSection>

        {/* Category Filter */}
        <StylistSection>
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
          <View style={styles.galleryGrid}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.galleryCard}>
                <View style={styles.imageContainer}>
                  <Ionicons name="image" size={50} color="#CCCCCC" />
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
});
