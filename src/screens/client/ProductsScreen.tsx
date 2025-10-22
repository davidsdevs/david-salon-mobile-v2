import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { APP_CONFIG, FONTS } from '../../constants';
import { Product } from '../../types';

const { width } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigation = useNavigation();
  
  const productsPerPage = 6;

  const products: Product[] = [
    {
      id: 1,
      name: 'L\'Oreal Professional Shampoo',
      price: '₱450',
      category: 'Hair Care'
    },
    {
      id: 2,
      name: 'Wella Hair Spray',
      price: '₱380',
      category: 'Styling'
    },
    {
      id: 3,
      name: 'Matrix Hair Color',
      price: '₱650',
      category: 'Coloring'
    },
    {
      id: 4,
      name: 'Schwarzkopf Treatment',
      price: '₱520',
      category: 'Treatment'
    },
    {
      id: 5,
      name: 'Wella Styling Spray',
      price: '₱420',
      category: 'Styling'
    },
    {
      id: 6,
      name: 'L\'Oreal Repair Shampoo',
      price: '₱480',
      category: 'Hair Care'
    },
    {
      id: 7,
      name: 'Matrix Color Shampoo',
      price: '₱350',
      category: 'Coloring'
    },
    {
      id: 8,
      name: 'Schwarzkopf Styling Gel',
      price: '₱280',
      category: 'Styling'
    },
    {
      id: 9,
      name: 'Wella Treatment Mask',
      price: '₱680',
      category: 'Treatment'
    }
  ];

  // Pagination logic
  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Product Catalog Header */}
        <View style={styles.productsSection}>
          <Text style={styles.catalogTitle}>Product Catalog</Text>
          <Text style={styles.catalogSubtitle}>Showing {currentProducts.length} of {products.length} products</Text>
          
          {/* Search and Filter */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchContainer}>
              <View style={styles.searchIcon}>
                <Ionicons name="search" size={20} color="#999" />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="search products..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="calendar" size={16} color="white" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
          
          {/* Scrollable Products Container */}
          <View style={styles.scrollableProductsContainer}>
            <ScrollView 
              style={styles.productsScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productsScrollContent}
            >
              <View style={styles.productsGrid}>
                {currentProducts.map((product) => (
                  <View key={product.id} style={styles.productCard}>
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="image" size={40} color="#CCCCCC" />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productCategory}>{product.category}</Text>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productPrice}>{product.price}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Pagination */}
          <View style={styles.paginationContainer}>
            <TouchableOpacity 
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#999" : "#160B53"} />
            </TouchableOpacity>
            
            <View style={styles.paginationNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <TouchableOpacity
                  key={page}
                  style={[
                    styles.paginationNumber,
                    currentPage === page && styles.paginationNumberActive
                  ]}
                  onPress={() => handlePageChange(page)}
                >
                  <Text style={[
                    styles.paginationNumberText,
                    currentPage === page && styles.paginationNumberTextActive
                  ]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#999" : "#160B53"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Products">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Product Catalog Header */}
        <View style={styles.productsSection}>
          <Text style={styles.catalogTitle}>Product Catalog</Text>
          <Text style={styles.catalogSubtitle}>Showing {products.length} products</Text>
          
          {/* Search and Filter */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchContainer}>
              <View style={styles.searchIcon}>
                <Ionicons name="search" size={20} color="#999" />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="search products..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="calendar" size={16} color="white" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
          {/* Products Grid */}
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="image" size={40} color="#CCCCCC" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{product.price}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: '100%',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: isIPhone ? 110 : 90,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: isIPhone ? 12 : 15,
    paddingTop: isIPhone ? 50 : 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  headerDate: {
    fontSize: 13,
    color: '#666',
    fontFamily: FONTS.regular,
  },
  catalogTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : Platform.OS === 'android' ? 16 : 20,
    color: Platform.OS === 'web' ? '#160B53' : '#160B53',
    marginBottom: Platform.OS === 'web' ? 16 : 4,
    fontFamily: Platform.OS === 'web' ? 'Poppins_700Bold' : FONTS.bold,
  },
  catalogSubtitle: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    marginBottom: 20,
    fontFamily: FONTS.regular,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#333',
    fontFamily: FONTS.regular,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#160B53',
    borderRadius: 8,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    height: Platform.OS === 'web' ? 44 : 36,
    gap: 6,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontFamily: FONTS.semiBold,
  },
  productsSection: {
    padding: Platform.OS === 'web' ? 0 : 20,
    paddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 30 : 20,
    marginBottom: Platform.OS === 'web' ? 24 : 0,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  productsGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'row',
    flexWrap: 'wrap',
    justifyContent: Platform.OS === 'web' ? 'space-between' : 'space-between',
    gap: Platform.OS === 'web' ? 16 : 12,
    width: '100%',
  },
  scrollableProductsContainer: {
    height: Platform.OS === 'web' ? 500 : undefined,
    marginBottom: Platform.OS === 'web' ? 20 : 0,
  },
  productsScrollView: {
    flex: 1,
  },
  productsScrollContent: {
    flexGrow: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E5E5',
  },
  paginationNumbers: {
    flexDirection: 'row',
    gap: 4,
  },
  paginationNumber: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationNumberActive: {
    backgroundColor: '#160B53',
    borderColor: '#160B53',
  },
  paginationNumberText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  paginationNumberTextActive: {
    color: '#FFFFFF',
  },
  productCard: {
    width: Platform.OS === 'web' ? '32%' : (width - 60) / 2, // 3 columns for web with proper spacing
    height: Platform.OS === 'web' ? 220 : 260, // Much longer height for mobile to fit text properly
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 12, // Reduced side padding for mobile
    paddingVertical: Platform.OS === 'web' ? 20 : 18, // Keep vertical padding
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 6 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.2 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 12 : 8,
    elevation: Platform.OS === 'web' ? 6 : 3,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  productImagePlaceholder: {
    width: '100%',
    height: Platform.OS === 'web' ? 100 : 120, // Increased height for mobile to fill longer card
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'web' ? 16 : 20, // Increased margin for mobile
  },
  productInfo: {
    padding: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 0 : Platform.OS === 'ios' ? 2 : 3, // Much more reduced padding for mobile
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  productCategory: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12, // Smaller for mobile
    color: '#160B53',
    marginBottom: 4, // Reduced margin
    fontFamily: FONTS.medium,
  },
  productName: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14, // Smaller for mobile
    color: '#333',
    marginBottom: 6, // Reduced margin
    fontFamily: FONTS.semiBold,
    lineHeight: Platform.OS === 'web' ? undefined : 18, // Smaller line height for mobile
  },
  productPrice: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16, // Smaller for mobile
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginTop: Platform.OS === 'web' ? 0 : 2, // Reduced top margin for mobile
  },
});
