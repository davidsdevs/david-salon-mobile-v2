import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import { APP_CONFIG, FONTS } from '../../constants';
import MobileAppointmentService, { AppointmentData } from '../../services/mobileAppointmentService';
import { useAuth } from '../../hooks/redux';

const { width } = Dimensions.get('window');

export default function BookingSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { 
    branchId, 
    selectedDate, 
    selectedTime, 
    selectedServices, 
    selectedStylists 
  } = route.params as { 
    branchId: string; 
    selectedDate: string; 
    selectedTime: string; 
    selectedServices: any[]; 
    selectedStylists: { [serviceId: string]: any }; 
  };
  
  const [isCreating, setIsCreating] = useState(false);

  const branchNames = {
    1: "David's Salon - Makati",
    2: "David's Salon - BGC", 
    3: "David's Salon - Ortigas",
    4: "David's Salon - Alabang",
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string | undefined | null) => {
    if (!timeString) {
      return 'N/A';
    }
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours || '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error, 'timeString:', timeString);
      return 'Invalid Time';
    }
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0);
  };

  const handleCreateAppointment = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to book an appointment.');
      return;
    }

    setIsCreating(true);
    
    try {
      // Prepare appointment data
      const appointmentData: AppointmentData = {
        clientId: user.id,
        clientFirstName: user.name?.split(' ')[0] || 'Client',
        clientLastName: user.name?.split(' ').slice(1).join(' ') || '',
        clientPhone: user.phone || '',
        clientEmail: user.email || '',
        services: selectedServices.map(service => ({
          id: service.id,
          name: service.name,
          duration: service.duration,
          price: service.price,
          category: service.category
        })),
        stylists: Object.entries(selectedStylists).map(([serviceId, stylist]) => ({
          serviceId,
          serviceName: selectedServices.find(s => s.id === serviceId)?.name || '',
          stylistId: stylist.id,
          stylistName: stylist.name
        })),
        date: selectedDate,
        time: selectedTime,
        totalCost: getTotalPrice(),
        notes: '',
        status: 'confirmed',
        branchId: branchId,
        createdBy: user.id
      };

      // Create appointment
      const appointmentId = await MobileAppointmentService.createAppointment(appointmentData);
      
      Alert.alert(
        'Appointment Booked!',
        'Your appointment has been successfully booked. You will receive a confirmation email shortly.',
        [
          {
            text: 'OK',
            onPress: () => (navigation as any).navigate('Appointments'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setIsCreating(false);
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
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Services & Stylist</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review & Confirm</Text>
          <Text style={styles.sectionSubtitle}>Review your appointment details before confirming</Text>
          
          <View style={styles.summaryCard}>
            {/* Client Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Client Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>Juan Cruz</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>client2@test.com</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>Male</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>09949057375</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Birthday</Text>
                  <Text style={styles.infoValue}>Not provided</Text>
                </View>
              </View>
            </View>

            {/* Appointment Details */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Appointment Details</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Branch</Text>
                  <Text style={styles.infoValue}>{branchNames[branchId as keyof typeof branchNames]}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedDate)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>{formatTime(selectedTime)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{getTotalDuration()} minutes</Text>
                </View>
              </View>
            </View>

            {/* Services & Stylists */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Services & Stylists</Text>
              <View style={styles.servicesList}>
                {selectedServices.map((service) => (
                  <View key={service.id} style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceCategory}>{service.category}</Text>
                      <Text style={styles.serviceDuration}>{service.duration} min</Text>
                    </View>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.stylistName}>
                        with {selectedStylists[service.id]?.name || 'No stylist assigned'}
                      </Text>
                      <Text style={styles.servicePrice}>₱{service.price}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Total Cost */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Price (Estimate)</Text>
                <Text style={styles.totalValue}>₱{getTotalPrice()}</Text>
              </View>
              <Text style={styles.totalNote}>* Final cost may vary based on service complexity</Text>
            </View>
          </View>
        </View>

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
            style={[styles.createButton, isCreating && styles.disabledButton]}
            onPress={handleCreateAppointment}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.createButtonText}>Creating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Book Now</Text>
              </>
            )}
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
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Services & Stylist</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review & Confirm</Text>
          <Text style={styles.sectionSubtitle}>Review your appointment details before confirming</Text>
          
          <View style={styles.summaryCard}>
            {/* Client Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Client Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>Juan Cruz</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>client2@test.com</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>Male</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>09949057375</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Birthday</Text>
                  <Text style={styles.infoValue}>Not provided</Text>
                </View>
              </View>
            </View>

            {/* Appointment Details */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Appointment Details</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Branch</Text>
                  <Text style={styles.infoValue}>{branchNames[branchId as keyof typeof branchNames]}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedDate)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>{formatTime(selectedTime)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{getTotalDuration()} minutes</Text>
                </View>
              </View>
            </View>

            {/* Services & Stylists */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Services & Stylists</Text>
              <View style={styles.servicesList}>
                {selectedServices.map((service) => (
                  <View key={service.id} style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceCategory}>{service.category}</Text>
                      <Text style={styles.serviceDuration}>{service.duration} min</Text>
                    </View>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.stylistName}>
                        with {selectedStylists[service.id]?.name || 'No stylist assigned'}
                      </Text>
                      <Text style={styles.servicePrice}>₱{service.price}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Total Cost */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Price (Estimate)</Text>
                <Text style={styles.totalValue}>₱{getTotalPrice()}</Text>
              </View>
              <Text style={styles.totalNote}>* Final cost may vary based on service complexity</Text>
            </View>
          </View>
        </View>

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
            style={[styles.createButton, isCreating && styles.disabledButton]}
            onPress={handleCreateAppointment}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.createButtonText}>Creating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Book Now</Text>
              </>
            )}
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 20 : Platform.OS === 'ios' ? 22 : 24,
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 17 : 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    fontFamily: FONTS.medium,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    fontFamily: FONTS.regular,
    color: '#160B53',
    flex: 1,
    textAlign: 'right',
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    fontFamily: FONTS.medium,
    color: APP_CONFIG.primaryColor,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    fontFamily: FONTS.regular,
    color: '#666',
  },
  serviceDetails: {
    alignItems: 'flex-end',
  },
  stylistName: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    fontFamily: FONTS.regular,
    color: '#10B981',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    fontFamily: FONTS.bold,
    color: APP_CONFIG.primaryColor,
  },
  totalSection: {
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: APP_CONFIG.primaryColor,
  },
  totalNote: {
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: APP_CONFIG.primaryColor,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});
