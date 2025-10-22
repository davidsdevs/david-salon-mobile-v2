import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import { APP_CONFIG, FONTS } from '../../constants';
import MobileAppointmentService, { Service, Stylist } from '../../services/mobileAppointmentService';

const { width } = Dimensions.get('window');

export default function ServiceStylistSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { branchId, selectedDate, selectedTime } = route.params as { 
    branchId: string; 
    selectedDate: string; 
    selectedTime: string; 
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStylists, setSelectedStylists] = useState<{ [serviceId: string]: Stylist }>({});
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [branchId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading data for branch:', branchId);
      
      const [servicesData, stylistsData] = await Promise.all([
        MobileAppointmentService.getAvailableServicesByBranch(branchId),
        MobileAppointmentService.getStylistsByBranch(branchId)
      ]);
      
      console.log('✅ Loaded services:', servicesData.length);
      console.log('✅ Loaded stylists:', stylistsData.length);
      console.log('📋 Services data:', servicesData);
      console.log('📋 Stylists data:', stylistsData);
      
      // If no services found with staff filtering, try getting all services
      if (servicesData.length === 0) {
        console.log('⚠️ No services found with staff filtering, trying all services...');
        const allServices = await MobileAppointmentService.getServicesByBranch(branchId);
        console.log('📋 All services data:', allServices);
        setServices(allServices);
      } else {
        setServices(servicesData);
      }
      
      // If no stylists found, try getting all stylists
      if (stylistsData.length === 0) {
        console.log('⚠️ No stylists found for branch, trying all stylists...');
        const allStylists = await MobileAppointmentService.getAllStylists();
        console.log('📋 All stylists data:', allStylists);
        setStylists(allStylists);
      } else {
        setStylists(stylistsData);
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load services and stylists. Please try again.');
      Alert.alert('Error', 'Failed to load services and stylists. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const categories = ['All Categories', 'Haircut', 'Coloring', 'Styling', 'Grooming'];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleServiceSelect = (service: Service) => {
    const updatedServices = selectedServices.some(s => s.id === service.id)
      ? selectedServices.filter(s => s.id !== service.id)
      : [...selectedServices, service];
    
    setSelectedServices(updatedServices);
    
    // Remove stylist assignment if service is deselected
    if (!updatedServices.some(s => s.id === service.id)) {
      const updatedStylists = { ...selectedStylists };
      delete updatedStylists[service.id];
      setSelectedStylists(updatedStylists);
    }
  };

  const handleStylistSelect = (serviceId: string, stylist: Stylist) => {
    setSelectedStylists({
      ...selectedStylists,
      [serviceId]: stylist,
    });
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0);
  };

  const handleNext = () => {
    if (selectedServices.length > 0) {
      (navigation as any).navigate('BookingSummary', {
        branchId,
        selectedDate,
        selectedTime,
        selectedServices,
        selectedStylists,
      });
    }
  };

  const handlePrevious = () => {
    navigation.goBack();
  };

  // For web, render with ResponsiveLayout to include sidebar
  if (Platform.OS === 'web') {
    return (
      <ResponsiveLayout currentScreen="Booking">
        <View style={styles.webContainer}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Select Branch</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Date & Time</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Services & Stylist</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
        </View>

        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Selection & Stylist Assignment</Text>
          <Text style={styles.sectionSubtitle}>Select services and assign stylists for each service</Text>
          
          <View style={styles.selectionContainer}>
            {/* Available Services */}
            <View style={styles.servicesContainer}>
              <View style={styles.servicesHeader}>
                <Text style={styles.containerTitle}>Available Services</Text>
                <Text style={styles.servicesCount}>{filteredServices.length} services</Text>
              </View>
              
              <View style={styles.searchFilterContainer}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#999" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search services..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <TouchableOpacity style={styles.categoryButton}>
                  <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
                  <Text style={styles.loadingText}>Loading services...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
                  {filteredServices.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      selectedServices.some(s => s.id === service.id) && styles.selectedServiceCard
                    ]}
                    onPress={() => handleServiceSelect(service)}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceCategory}>{service.category}</Text>
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                      <View style={styles.serviceDetails}>
                        <View style={styles.serviceDetailItem}>
                          <Ionicons name="time" size={16} color="#666" />
                          <Text style={styles.serviceDetailText}>{service.duration} min</Text>
                        </View>
                        <Text style={styles.servicePrice}>₱{service.price}</Text>
                      </View>
                    </View>
                    {selectedServices.some(s => s.id === service.id) && (
                      <Ionicons name="checkmark-circle" size={24} color={APP_CONFIG.primaryColor} />
                    )}
                  </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Stylist Assignment */}
            <View style={styles.stylistsContainer}>
              <Text style={styles.containerTitle}>Stylist Assignment</Text>
              
              {selectedServices.length > 0 ? (
                <ScrollView style={styles.stylistsList} showsVerticalScrollIndicator={false}>
                  {selectedServices.map((service) => (
                    <View key={service.id} style={styles.stylistAssignmentCard}>
                      <Text style={styles.serviceTitle}>{service.name}</Text>
                      <Text style={styles.assignedStylist}>
                        {selectedStylists[service.id] 
                          ? `Assigned: ${selectedStylists[service.id]?.name}` 
                          : 'Select a stylist'
                        }
                      </Text>
                      
                      <View style={styles.stylistsGrid}>
                        {stylists
                          .filter(stylist => stylist.serviceIds.includes(service.id))
                          .map((stylist) => (
                            <TouchableOpacity
                              key={stylist.id}
                              style={[
                                styles.stylistCard,
                                selectedStylists[service.id]?.id === stylist.id && styles.selectedStylistCard,
                                !stylist.isAvailable && styles.unavailableStylistCard
                              ]}
                              onPress={() => stylist.isAvailable && handleStylistSelect(service.id, stylist)}
                              disabled={!stylist.isAvailable}
                            >
                              <Text style={[
                                styles.stylistName,
                                !stylist.isAvailable && styles.unavailableText
                              ]}>
                                {stylist.name}
                              </Text>
                              <Text style={[
                                styles.stylistRating,
                                !stylist.isAvailable && styles.unavailableText
                              ]}>
                                ⭐ {stylist.rating}
                              </Text>
                              {!stylist.isAvailable && (
                                <Text style={styles.unavailableLabel}>Unavailable</Text>
                              )}
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noServicesSelected}>
                  <Ionicons name="cut" size={48} color="#CCCCCC" />
                  <Text style={styles.noServicesText}>Select services to assign stylists</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Summary */}
        {selectedServices.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Estimated Total: ₱{getTotalPrice()}</Text>
            <Text style={styles.summarySubtitle}>
              Duration: {getTotalDuration()} minutes • {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryNote}>* Final cost may vary based on service complexity</Text>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={styles.previousButton}
            onPress={handlePrevious}
          >
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              selectedServices.length === 0 && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={selectedServices.length === 0}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        </View>
      </ResponsiveLayout>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Book Appointment">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Select Branch</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Date & Time</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Services & Stylist</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
        </View>

        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Selection & Stylist Assignment</Text>
          <Text style={styles.sectionSubtitle}>Select services and assign stylists for each service</Text>
          
          <View style={styles.selectionContainer}>
            {/* Available Services */}
            <View style={styles.servicesContainer}>
              <View style={styles.servicesHeader}>
                <Text style={styles.containerTitle}>Available Services</Text>
                <Text style={styles.servicesCount}>{filteredServices.length} services</Text>
              </View>
              
              <View style={styles.searchFilterContainer}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#999" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search services..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <TouchableOpacity style={styles.categoryButton}>
                  <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
                  <Text style={styles.loadingText}>Loading services...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
                  {filteredServices.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      selectedServices.some(s => s.id === service.id) && styles.selectedServiceCard
                    ]}
                    onPress={() => handleServiceSelect(service)}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceCategory}>{service.category}</Text>
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                      <View style={styles.serviceDetails}>
                        <View style={styles.serviceDetailItem}>
                          <Ionicons name="time" size={16} color="#666" />
                          <Text style={styles.serviceDetailText}>{service.duration} min</Text>
                        </View>
                        <Text style={styles.servicePrice}>₱{service.price}</Text>
                      </View>
                    </View>
                    {selectedServices.some(s => s.id === service.id) && (
                      <Ionicons name="checkmark-circle" size={24} color={APP_CONFIG.primaryColor} />
                    )}
                  </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Stylist Assignment */}
            <View style={styles.stylistsContainer}>
              <Text style={styles.containerTitle}>Stylist Assignment</Text>
              
              {selectedServices.length > 0 ? (
                <ScrollView style={styles.stylistsList} showsVerticalScrollIndicator={false}>
                  {selectedServices.map((service) => (
                    <View key={service.id} style={styles.stylistAssignmentCard}>
                      <Text style={styles.serviceTitle}>{service.name}</Text>
                      <Text style={styles.assignedStylist}>
                        {selectedStylists[service.id] 
                          ? `Assigned: ${selectedStylists[service.id]?.name}` 
                          : 'Select a stylist'
                        }
                      </Text>
                      
                      <View style={styles.stylistsGrid}>
                        {stylists
                          .filter(stylist => stylist.serviceIds.includes(service.id))
                          .map((stylist) => (
                            <TouchableOpacity
                              key={stylist.id}
                              style={[
                                styles.stylistCard,
                                selectedStylists[service.id]?.id === stylist.id && styles.selectedStylistCard,
                                !stylist.isAvailable && styles.unavailableStylistCard
                              ]}
                              onPress={() => stylist.isAvailable && handleStylistSelect(service.id, stylist)}
                              disabled={!stylist.isAvailable}
                            >
                              <Text style={[
                                styles.stylistName,
                                !stylist.isAvailable && styles.unavailableText
                              ]}>
                                {stylist.name}
                              </Text>
                              <Text style={[
                                styles.stylistRating,
                                !stylist.isAvailable && styles.unavailableText
                              ]}>
                                ⭐ {stylist.rating}
                              </Text>
                              {!stylist.isAvailable && (
                                <Text style={styles.unavailableLabel}>Unavailable</Text>
                              )}
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noServicesSelected}>
                  <Ionicons name="cut" size={48} color="#CCCCCC" />
                  <Text style={styles.noServicesText}>Select services to assign stylists</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Summary */}
        {selectedServices.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Estimated Total: ₱{getTotalPrice()}</Text>
            <Text style={styles.summarySubtitle}>
              Duration: {getTotalDuration()} minutes • {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryNote}>* Final cost may vary based on service complexity</Text>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={styles.previousButton}
            onPress={handlePrevious}
          >
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              selectedServices.length === 0 && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={selectedServices.length === 0}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 30 : 20,
    flexWrap: 'wrap',
    minHeight: Platform.OS === 'android' ? 60 : 70,
  },
  progressStep: {
    alignItems: 'center',
    minWidth: Platform.OS === 'android' ? 50 : 55,
    justifyContent: 'center',
  },
  stepCircle: {
    width: Platform.OS === 'web' ? 40 : Platform.OS === 'ios' ? 32 : 36,
    height: Platform.OS === 'web' ? 40 : Platform.OS === 'ios' ? 32 : 36,
    borderRadius: Platform.OS === 'web' ? 20 : Platform.OS === 'ios' ? 16 : 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  activeStep: {
    backgroundColor: APP_CONFIG.primaryColor,
  },
  stepNumber: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 12 : 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: Platform.OS === 'web' ? 12 : Platform.OS === 'android' ? 9 : 9,
    fontFamily: FONTS.medium,
    color: '#666',
    textAlign: 'center',
    maxWidth: Platform.OS === 'android' ? 50 : 55,
    marginTop: 2,
  },
  progressLine: {
    width: Platform.OS === 'web' ? 60 : Platform.OS === 'android' ? 30 : 35,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: Platform.OS === 'web' ? 8 : Platform.OS === 'android' ? 2 : 3,
    marginTop: Platform.OS === 'web' ? -20 : Platform.OS === 'android' ? -16 : -14,
    alignSelf: 'center',
  },
  section: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : 18,
    color: Platform.OS === 'web' ? '#160B53' : '#160B53',
    fontFamily: Platform.OS === 'web' ? 'Poppins_700Bold' : FONTS.bold,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    fontFamily: FONTS.regular,
    marginBottom: 24,
  },
  selectionContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 24,
  },
  servicesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 18 : 20,
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
  stylistsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 18 : 20,
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  containerTitle: {
    fontSize: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 17 : 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  servicesCount: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#333',
    marginLeft: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  servicesList: {
    maxHeight: 400,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedServiceCard: {
    backgroundColor: '#E3F2FD',
    borderColor: APP_CONFIG.primaryColor,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: APP_CONFIG.primaryColor,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#666',
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#666',
  },
  servicePrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: APP_CONFIG.primaryColor,
  },
  stylistsList: {
    maxHeight: 400,
  },
  stylistAssignmentCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  assignedStylist: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#10B981',
    marginBottom: 12,
  },
  stylistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stylistCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 100,
  },
  selectedStylistCard: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  unavailableStylistCard: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  stylistName: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 2,
  },
  stylistRating: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: '#666',
  },
  unavailableText: {
    color: '#999',
  },
  unavailableLabel: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    color: '#999',
    marginTop: 2,
  },
  noServicesSelected: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noServicesText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#999',
    marginTop: 12,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: 24,
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#666',
    marginBottom: 8,
  },
  summaryNote: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#999',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingVertical: Platform.OS === 'web' ? 20 : 16,
    gap: Platform.OS === 'web' ? 0 : 12,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  previousButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: APP_CONFIG.primaryColor,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
