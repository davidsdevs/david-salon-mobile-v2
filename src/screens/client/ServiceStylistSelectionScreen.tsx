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
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import { APP_CONFIG, FONTS } from '../../constants';
import MobileAppointmentService, { Service, Stylist } from '../../services/mobileAppointmentService';
import { useBooking } from '../../context/BookingContext';

const { width } = Dimensions.get('window');

export default function ServiceStylistSelectionScreen() {
  const navigation = useNavigation();
  const { state, setService, setStylist, setMultipleServices, setLoading, setError } = useBooking();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showChemicalModal, setShowChemicalModal] = useState(false);
  const [selectedChemicalService, setSelectedChemicalService] = useState<Service | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStylists, setSelectedStylists] = useState<{ [serviceId: string]: Stylist }>({});
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [serviceStylists, setServiceStylists] = useState<{ [serviceId: string]: Stylist[] }>({});
  const [loading, setLoadingLocal] = useState(true);
  const [error, setErrorLocal] = useState<string | null>(null);
  

  useEffect(() => {
    if (state.bookingData.branchId) {
      loadData();
    }
  }, [state.bookingData.branchId]);

  // Debug chemical modal state changes
  useEffect(() => {
    console.log('🧪 Chemical modal visibility changed:', showChemicalModal);
  }, [showChemicalModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingLocal(true);
      setError(null);
      setErrorLocal(null);
      
      console.log('🔄 Loading data for branch:', state.bookingData.branchId);
      
      // Only load services initially - stylists will be loaded when service is selected
      const servicesData = await MobileAppointmentService.getAvailableServicesByBranch(state.bookingData.branchId || '');
      
      console.log('✅ Loaded services:', servicesData.length);
      console.log('📋 Services data:', servicesData);
      
      // Debug: Check which services have isChemical property
      servicesData.forEach(service => {
        console.log(`🔍 Service: ${service.name}, isChemical: ${service.isChemical}`);
        console.log(`🔍 Full service object:`, service);
      });
      
      setServices(servicesData);
      
      // Initialize empty stylists array - will be populated when service is selected
      setStylists([]);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      const errorMsg = 'Failed to load services and stylists. Please try again.';
      setError(errorMsg);
      setErrorLocal(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
      setLoadingLocal(false);
    }
  };


  // Get unique categories from the services data (like SELECT DISTINCT)
  const getUniqueCategories = () => {
    const uniqueCategories = [...new Set(services.map(service => service.category))];
    return ['All Categories', ...uniqueCategories.sort()];
  };

  const categories = getUniqueCategories();

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleServiceSelect = async (service: Service) => {
    console.log('🔍 Service selected:', {
      serviceId: service.id,
      serviceName: service.name,
      serviceIdType: typeof service.id,
      serviceIdLength: service.id.length,
      isChemical: service.isChemical,
      fullServiceObject: service
    });
    
    // Check if this is a chemical service and it's being selected (not deselected)
    const isSelecting = !selectedServices.some(s => s.id === service.id);
    console.log('🔍 Selection check:', {
      isSelecting,
      isChemical: service.isChemical,
      serviceName: service.name,
      shouldShowModal: isSelecting && service.isChemical
    });
    
    // Check if this is a chemical service (isChemical === true)
    if (isSelecting && service.isChemical === true) {
      console.log('🧪 Chemical service selected, showing warning modal');
      console.log('🧪 Service details:', { name: service.name, isChemical: service.isChemical });
      setSelectedChemicalService(service);
      setShowChemicalModal(true);
      console.log('✅ Modal state set to true');
      return; // Don't proceed with selection until user acknowledges
    }
    
    const updatedServices = selectedServices.some(s => s.id === service.id)
      ? selectedServices.filter(s => s.id !== service.id)
      : [...selectedServices, service];
    
    setSelectedServices(updatedServices);
    
    // If service is being selected, filter stylists for this service
    if (updatedServices.some(s => s.id === service.id)) {
      try {
        setLoading(true);
        setLoadingLocal(true);
        
        console.log('🔄 Fetching stylists for service:', service.id, 'at branch:', state.bookingData.branchId);
        
        // Get stylists who can perform this service at this branch
        const availableStylists = await MobileAppointmentService.getStylistsByServiceAndBranch(
          service.id, 
          state.bookingData.branchId || ''
        );
        
        console.log(`✅ Found ${availableStylists.length} stylists for service ${service.name}`);
        
        // Store stylists for this specific service
        setServiceStylists(prev => ({
          ...prev,
          [service.id]: availableStylists
        }));
        
        // Also update the general stylists state for backward compatibility
        setStylists(availableStylists);
      } catch (error) {
        console.error('❌ Error fetching stylists for service:', error);
        console.error('❌ Error details:', {
          serviceId: service.id,
          serviceName: service.name,
          branchId: state.bookingData.branchId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setError('Failed to load stylists for this service');
        setErrorLocal('Failed to load stylists for this service');
      } finally {
        setLoading(false);
        setLoadingLocal(false);
      }
    } else {
      // Remove stylist assignment and service stylists if service is deselected
      const updatedStylists = { ...selectedStylists };
      delete updatedStylists[service.id];
      setSelectedStylists(updatedStylists);
      
      // Also remove the stylists for this service
      setServiceStylists(prev => {
        const updated = { ...prev };
        delete updated[service.id];
        return updated;
      });
    }
  };

  const handleStylistSelect = (serviceId: string, stylist: Stylist) => {
    setSelectedStylists({
      ...selectedStylists,
      [serviceId]: stylist,
    });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };

  const handleChemicalModalConfirm = async () => {
    if (!selectedChemicalService) return;
    
    console.log('🧪 User confirmed chemical service selection:', selectedChemicalService.name);
    setShowChemicalModal(false);
    
    // Now proceed with the service selection
    const updatedServices = [...selectedServices, selectedChemicalService];
    setSelectedServices(updatedServices);
    
    // Load stylists for this service
    try {
      setLoading(true);
      setLoadingLocal(true);
      
      console.log('🔄 Fetching stylists for chemical service:', selectedChemicalService.id, 'at branch:', state.bookingData.branchId);
      
      const availableStylists = await MobileAppointmentService.getStylistsByServiceAndBranch(
        selectedChemicalService.id, 
        state.bookingData.branchId || ''
      );
      
      console.log(`✅ Found ${availableStylists.length} stylists for chemical service ${selectedChemicalService.name}`);
      
      setServiceStylists(prev => ({
        ...prev,
        [selectedChemicalService.id]: availableStylists
      }));
      
      setStylists(availableStylists);
    } catch (error) {
      console.error('❌ Error fetching stylists for chemical service:', error);
      setError('Failed to load stylists for this service');
      setErrorLocal('Failed to load stylists for this service');
    } finally {
      setLoading(false);
      setLoadingLocal(false);
    }
  };

  const handleChemicalModalCancel = () => {
    console.log('🧪 User cancelled chemical service selection');
    setShowChemicalModal(false);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => {
      const price = typeof service.price === 'string' ? parseFloat(service.price) : service.price;
      return total + (isNaN(price) ? 0 : price);
    }, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((total, service) => {
      const duration = typeof service.duration === 'string' ? parseInt(service.duration) : service.duration;
      return total + (isNaN(duration) ? 0 : duration);
    }, 0);
  };


  const handleNext = () => {
    // Validation 1: Check if any services are selected
    if (selectedServices.length === 0) {
      Alert.alert(
        'No Services Selected',
        'Please select at least one service to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation 2: Check if all selected services have assigned stylists
    const servicesWithoutStylists = selectedServices.filter(service => !selectedStylists[service.id]);
    if (servicesWithoutStylists.length > 0) {
      const serviceNames = servicesWithoutStylists.map(s => s.name).join(', ');
      Alert.alert(
        'Stylist Assignment Required',
        `Please assign a stylist for: ${serviceNames}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation 3: Validate service data integrity
    const invalidServices = selectedServices.filter(service => 
      !service.id || !service.name || !service.price || !service.duration
    );
    if (invalidServices.length > 0) {
      Alert.alert(
        'Invalid Service Data',
        'Some selected services have missing information. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation 4: Validate stylist data integrity
    const invalidStylists = selectedServices.filter(service => {
      const stylist = selectedStylists[service.id];
      return !stylist || !stylist.id || !stylist.firstName || !stylist.lastName;
    });
    if (invalidStylists.length > 0) {
      Alert.alert(
        'Invalid Stylist Data',
        'Some assigned stylists have missing information. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation 5: Check if stylists are available
    const unavailableStylists = selectedServices.filter(service => {
      const stylist = selectedStylists[service.id];
      return stylist && !stylist.isAvailable;
    });
    if (unavailableStylists.length > 0) {
      const stylistNames = unavailableStylists.map(service => {
        const stylist = selectedStylists[service.id];
        return `${stylist?.firstName} ${stylist?.lastName}`;
      }).join(', ');
      Alert.alert(
        'Stylist Unavailable',
        `The following stylists are not available: ${stylistNames}. Please select different stylists.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Calculate total price and duration for all selected services
    // Ensure prices are numbers, not strings
    const totalPrice = selectedServices.reduce((total, service) => {
      const price = typeof service.price === 'string' ? parseFloat(service.price) : service.price;
      return total + (isNaN(price) ? 0 : price);
    }, 0);
    const totalDuration = selectedServices.reduce((total, service) => {
      const duration = typeof service.duration === 'string' ? parseInt(service.duration) : service.duration;
      return total + (isNaN(duration) ? 0 : duration);
    }, 0);

    // Validation 6: Check if total price is valid
    if (totalPrice <= 0) {
      Alert.alert(
        'Invalid Total Price',
        'The total price calculation resulted in an invalid amount. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation 7: Check if total duration is valid
    if (totalDuration <= 0) {
      Alert.alert(
        'Invalid Total Duration',
        'The total duration calculation resulted in an invalid amount. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Get the first service for validation
    const firstService = selectedServices[0];
    if (!firstService) {
      Alert.alert('Error', 'No service selected');
      return;
    }
    const firstStylist = selectedStylists[firstService.id];
    
    if (firstService && firstStylist) {
      // Convert services to the format expected by the context
      const selectedServicesData = selectedServices.map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        category: service.category,
      }));
      
      // Convert stylists to the format expected by the context
      const selectedStylistsData: { [serviceId: string]: any } = {};
      selectedServices.forEach(service => {
        const stylist = selectedStylists[service.id];
        if (stylist) {
          selectedStylistsData[service.id] = {
            id: stylist.id,
            name: `${stylist.firstName} ${stylist.lastName}`,
            firstName: stylist.firstName,
            lastName: stylist.lastName,
          };
        }
      });
      
      // Save all services and their totals
      setMultipleServices({
        selectedServices: selectedServicesData,
        selectedStylists: selectedStylistsData,
        totalPrice: totalPrice,
        totalDuration: totalDuration,
      });
      
      // Navigate to next step
      (navigation as any).navigate('BookingSummary');
    } else {
      Alert.alert('Selection Required', 'Please select both a service and stylist to continue.');
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
                <TouchableOpacity 
                  style={styles.categoryButton}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              
              {(loading || state.isLoading) ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
                  <Text style={styles.loadingText}>Loading services...</Text>
                </View>
              ) : (error || state.error) ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.servicesScrollContainer}>
                  <ScrollView 
                    style={styles.servicesList} 
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    scrollEnabled={true}
                  >
                    {filteredServices.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceCard,
                          selectedServices.some(s => s.id === service.id) && styles.selectedServiceCard
                        ]}
                        onPress={() => {
                          console.log('🖱️ Service card pressed:', service.name, 'isChemical:', service.isChemical);
                          handleServiceSelect(service);
                        }}
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
                            <View style={styles.priceContainer}>
                              <Text style={styles.priceEstimate}>Starting from</Text>
                              <Text style={styles.servicePrice}>₱{service.price}</Text>
                            </View>
                          </View>
                        </View>
                        {selectedServices.some(s => s.id === service.id) && (
                          <Ionicons name="checkmark-circle" size={24} color={APP_CONFIG.primaryColor} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
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
                        {(() => {
                          const stylistsForService = serviceStylists[service.id];
                          return stylistsForService && stylistsForService.length > 0 ? (
                            stylistsForService.map((stylist) => (
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
                                selectedStylists[service.id]?.id === stylist.id && styles.selectedStylistName,
                                !stylist.isAvailable && styles.unavailableText
                              ]}>
                                {stylist.name}
                              </Text>
                              <Text style={[
                                styles.stylistRating,
                                selectedStylists[service.id]?.id === stylist.id && styles.selectedStylistRating,
                                !stylist.isAvailable && styles.unavailableText
                              ]}>
                                ⭐ {stylist.rating}
                              </Text>
                              {!stylist.isAvailable && (
                                <Text style={styles.unavailableLabel}>Unavailable</Text>
                              )}
                            </TouchableOpacity>
                            ))
                          ) : (
                            <View style={styles.noStylistsContainer}>
                              <Ionicons name="person-outline" size={32} color="#CCCCCC" />
                              <Text style={styles.noStylistsText}>No stylists available for this service</Text>
                            </View>
                          );
                        })()}
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
            <View style={styles.priceEstimateHeader}>
              <Text style={styles.summaryTitle}>Estimated Total: ₱{getTotalPrice()}</Text>
              <View style={styles.estimateBadge}>
                <Text style={styles.estimateBadgeText}>ESTIMATE</Text>
              </View>
            </View>
            <Text style={styles.summarySubtitle}>
              Duration: {getTotalDuration()} minutes • {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryNote}>* Final cost may vary based on service complexity and additional requirements</Text>
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

        {/* Category Selection Modal */}
        {showCategoryModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Category</Text>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category && styles.selectedCategoryOption
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    selectedCategory === category && styles.selectedCategoryOptionText
                  ]}>
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <Ionicons name="checkmark" size={20} color={APP_CONFIG.primaryColor} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Chemical Service Warning Modal */}
        {showChemicalModal && selectedChemicalService && (
          <View style={styles.modalOverlay}>
            <View style={styles.chemicalModalContainer}>
              <View style={styles.chemicalModalHeader}>
                <View style={styles.chemicalIconContainer}>
                  <Ionicons name="warning" size={32} color="#F59E0B" />
                </View>
                <Text style={styles.chemicalModalTitle}>Chemical Service Warning</Text>
              </View>
              
              <View style={styles.chemicalModalContent}>
                <Text style={styles.chemicalServiceName}>{selectedChemicalService.name}</Text>
                <Text style={styles.chemicalWarningText}>
                  ⚠️ This service involves chemical treatments that require a patch test.
                </Text>
                <Text style={styles.chemicalRequirementText}>
                  You must arrive at the salon 10 minutes before your appointment time to have a chemical patch test performed. This is mandatory for your safety.
                </Text>
                <View style={styles.chemicalInfoBox}>
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text style={styles.chemicalInfoText}>
                    The patch test helps identify any potential allergic reactions before the full treatment.
                  </Text>
                </View>
              </View>
              
              <View style={styles.chemicalModalActions}>
                <TouchableOpacity 
                  style={styles.chemicalCancelButton}
                  onPress={handleChemicalModalCancel}
                >
                  <Text style={styles.chemicalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.chemicalConfirmButton}
                  onPress={handleChemicalModalConfirm}
                >
                  <Text style={styles.chemicalConfirmButtonText}>I Understand</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
                <TouchableOpacity 
                  style={styles.categoryButton}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              
              {(loading || state.isLoading) ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
                  <Text style={styles.loadingText}>Loading services...</Text>
                </View>
              ) : (error || state.error) ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.servicesScrollContainer}>
                  <ScrollView 
                    style={styles.servicesList} 
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    scrollEnabled={true}
                  >
                    {filteredServices.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceCard,
                          selectedServices.some(s => s.id === service.id) && styles.selectedServiceCard
                        ]}
                        onPress={() => {
                          console.log('🖱️ Service card pressed:', service.name, 'isChemical:', service.isChemical);
                          handleServiceSelect(service);
                        }}
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
                            <View style={styles.priceContainer}>
                              <Text style={styles.priceEstimate}>Starting from</Text>
                              <Text style={styles.servicePrice}>₱{service.price}</Text>
                            </View>
                          </View>
                        </View>
                        {selectedServices.some(s => s.id === service.id) && (
                          <Ionicons name="checkmark-circle" size={24} color={APP_CONFIG.primaryColor} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
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
                        {(() => {
                          const stylistsForService = serviceStylists[service.id];
                          return stylistsForService && stylistsForService.length > 0 ? (
                            stylistsForService.map((stylist) => (
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
                                selectedStylists[service.id]?.id === stylist.id && styles.selectedStylistName,
                                !stylist.isAvailable && styles.unavailableText
                              ]}>
                                {stylist.name}
                              </Text>
                              <Text style={[
                                styles.stylistRating,
                                selectedStylists[service.id]?.id === stylist.id && styles.selectedStylistRating,
                                !stylist.isAvailable && styles.unavailableText
                              ]}>
                                ⭐ {stylist.rating}
                              </Text>
                              {!stylist.isAvailable && (
                                <Text style={styles.unavailableLabel}>Unavailable</Text>
                              )}
                            </TouchableOpacity>
                            ))
                          ) : (
                            <View style={styles.noStylistsContainer}>
                              <Ionicons name="person-outline" size={32} color="#CCCCCC" />
                              <Text style={styles.noStylistsText}>No stylists available for this service</Text>
                            </View>
                          );
                        })()}
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
            <View style={styles.priceEstimateHeader}>
              <Text style={styles.summaryTitle}>Estimated Total: ₱{getTotalPrice()}</Text>
              <View style={styles.estimateBadge}>
                <Text style={styles.estimateBadgeText}>ESTIMATE</Text>
              </View>
            </View>
            <Text style={styles.summarySubtitle}>
              Duration: {getTotalDuration()} minutes • {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryNote}>* Final cost may vary based on service complexity and additional requirements</Text>
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

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selectedCategory === category && styles.selectedCategoryOption
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  selectedCategory === category && styles.selectedCategoryOptionText
                ]}>
                  {category}
                </Text>
                {selectedCategory === category && (
                  <Ionicons name="checkmark" size={20} color={APP_CONFIG.primaryColor} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Chemical Service Warning Modal */}
      {showChemicalModal && selectedChemicalService && (
        <View style={styles.modalOverlay}>
          <View style={styles.chemicalModalContainer}>
            <View style={styles.chemicalModalHeader}>
              <View style={styles.chemicalIconContainer}>
                <Ionicons name="warning" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.chemicalModalTitle}>Chemical Service Warning</Text>
            </View>
            
            <View style={styles.chemicalModalContent}>
              <Text style={styles.chemicalServiceName}>{selectedChemicalService.name}</Text>
              <Text style={styles.chemicalWarningText}>
                ⚠️ This service involves chemical treatments that require a patch test.
              </Text>
              <Text style={styles.chemicalRequirementText}>
                You must arrive at the salon 10 minutes before your appointment time to have a chemical patch test performed. This is mandatory for your safety.
              </Text>
              <View style={styles.chemicalInfoBox}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.chemicalInfoText}>
                  The patch test helps identify any potential allergic reactions before the full treatment.
                </Text>
              </View>
            </View>
            
            <View style={styles.chemicalModalActions}>
              <TouchableOpacity 
                style={styles.chemicalCancelButton}
                onPress={handleChemicalModalCancel}
              >
                <Text style={styles.chemicalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.chemicalConfirmButton}
                onPress={handleChemicalModalConfirm}
              >
                <Text style={styles.chemicalConfirmButtonText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    height: 400,
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
  servicesScrollContainer: {
    flex: 1,
    marginTop: 8,
  },
  servicesList: {
    maxHeight: 300,
  },
  servicesListContent: {
    paddingBottom: 20,
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
  priceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: APP_CONFIG.primaryColor,
    marginTop: 2,
  },
  priceEstimate: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#666',
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
    backgroundColor: 'transparent',
    borderColor: APP_CONFIG.primaryColor,
    borderWidth: 2,
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
  selectedStylistName: {
    color: APP_CONFIG.primaryColor,
    fontFamily: FONTS.bold,
  },
  stylistRating: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: '#666',
  },
  selectedStylistRating: {
    color: APP_CONFIG.primaryColor,
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
  noStylistsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noStylistsText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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
  priceEstimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  estimateBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  estimateBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#D97706',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedCategoryOption: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: APP_CONFIG.primaryColor,
  },
  categoryOptionText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#333',
  },
  selectedCategoryOptionText: {
    color: APP_CONFIG.primaryColor,
    fontFamily: FONTS.bold,
  },
  modalCloseButton: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  // Chemical Modal Styles
  chemicalModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  chemicalModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chemicalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  chemicalModalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#160B53',
    textAlign: 'center',
  },
  chemicalModalContent: {
    marginBottom: 24,
  },
  chemicalServiceName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
    textAlign: 'center',
    marginBottom: 16,
  },
  chemicalWarningText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 12,
  },
  chemicalRequirementText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#374151',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  chemicalInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  chemicalInfoText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  chemicalModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  chemicalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chemicalCancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  chemicalConfirmButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chemicalConfirmButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});
