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
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import { APP_CONFIG, FONTS } from '../../constants';
import MobileAppointmentService, { AppointmentData } from '../../services/mobileAppointmentService';
import { useAuth } from '../../hooks/redux';
import { useBooking } from '../../context/BookingContext';

const { width } = Dimensions.get('window');

export default function BookingSummaryScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { state, resetBooking } = useBooking();
  
  const [isCreating, setIsCreating] = useState(false);
  const [notes, setNotes] = useState(state.bookingData.notes || '');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const branchNames = {
    1: "David's Salon - Makati",
    2: "David's Salon - BGC", 
    3: "David's Salon - Ortigas",
    4: "David's Salon - Alabang",
  };

  const getBranchName = (branchId: string | number | undefined) => {
    if (!branchId) return 'Unknown Branch';
    
    // Convert to number if it's a string
    const numericId = typeof branchId === 'string' ? parseInt(branchId) : branchId;
    
    // Check if it's a valid branch ID
    if (numericId === 1 || numericId === 2 || numericId === 3 || numericId === 4) {
      return branchNames[numericId as keyof typeof branchNames];
    }
    
    return 'Unknown Branch';
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
    // Use totalPrice if available (for multiple services), otherwise fall back to servicePrice
    const totalPrice = state.bookingData.totalPrice || state.bookingData.servicePrice || 0;
    // Ensure it's a number, not a string
    return typeof totalPrice === 'string' ? parseFloat(totalPrice) || 0 : totalPrice;
  };

  const getTotalDuration = () => {
    // Use totalDuration if available (for multiple services), otherwise fall back to serviceDuration
    const totalDuration = state.bookingData.totalDuration || state.bookingData.serviceDuration || 0;
    // Ensure it's a number, not a string
    return typeof totalDuration === 'string' ? parseInt(totalDuration) || 0 : totalDuration;
  };

  const handleCreateAppointment = () => {
    // Validation 1: Check if user is logged in
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to book an appointment.');
      return;
    }

    // Validation 2: Check if user has required information
    if (!user.id || !user.name || !user.email) {
      Alert.alert('Incomplete Profile', 'Please complete your profile information before booking.');
      return;
    }

    // Validation 3: Check if booking data is complete
    if (!state.bookingData.branchId || !state.bookingData.date || !state.bookingData.time) {
      Alert.alert('Missing Information', 'Please go back and select a branch, date, and time.');
      return;
    }

    // Validation 4: Check if services are selected
    if (!state.bookingData.selectedServices || state.bookingData.selectedServices.length === 0) {
      if (!state.bookingData.serviceId) {
        Alert.alert('No Services Selected', 'Please go back and select at least one service.');
        return;
      }
    }

    // Validation 5: Check if stylists are assigned
    if (state.bookingData.selectedServices && state.bookingData.selectedServices.length > 0) {
      const servicesWithoutStylists = state.bookingData.selectedServices.filter(service => 
        !state.bookingData.selectedStylists?.[service.id]
      );
      if (servicesWithoutStylists.length > 0) {
        Alert.alert('Stylist Assignment Required', 'Please go back and assign stylists for all services.');
        return;
      }
    } else if (!state.bookingData.stylistId) {
      Alert.alert('No Stylist Assigned', 'Please go back and select a stylist.');
      return;
    }

    // Validation 6: Validate date format and future date
    const appointmentDate = new Date(state.bookingData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(appointmentDate.getTime())) {
      Alert.alert('Invalid Date', 'Please select a valid appointment date.');
      return;
    }
    
    if (appointmentDate < today) {
      Alert.alert('Invalid Date', 'Please select a future date for your appointment.');
      return;
    }

    // Validation 7: Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!state.bookingData.time || !timeRegex.test(state.bookingData.time)) {
      Alert.alert('Invalid Time', 'Please select a valid appointment time.');
      return;
    }

    // Validation 8: Check if total price is valid
    const totalPrice = getTotalPrice();
    if (totalPrice <= 0) {
      Alert.alert('Invalid Price', 'The total price is invalid. Please go back and reselect services.');
      return;
    }

    // Validation 9: Check if total duration is valid
    const totalDuration = getTotalDuration();
    if (totalDuration <= 0) {
      Alert.alert('Invalid Duration', 'The total duration is invalid. Please go back and reselect services.');
      return;
    }

    // Validation 10: Check for duplicate services
    if (state.bookingData.selectedServices && state.bookingData.selectedServices.length > 0) {
      const serviceIds = state.bookingData.selectedServices.map(s => s.id);
      const uniqueServiceIds = [...new Set(serviceIds)];
      if (serviceIds.length !== uniqueServiceIds.length) {
        Alert.alert('Duplicate Services', 'You have selected the same service multiple times. Please go back and fix this.');
        return;
      }
    }

    // Validation 11: Check notes validation
    if (notesError) {
      Alert.alert('Invalid Notes', 'Please fix the notes field before proceeding.');
      return;
    }

    // Validation 12: Check notes length
    if (notes.length > 500) {
      Alert.alert('Notes Too Long', 'Notes cannot exceed 500 characters.');
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const handleConfirmAppointment = async () => {
    setShowConfirmationModal(false);

    setIsCreating(true);
    
    try {
      // Validation 11: Final data integrity check before creating appointment
      const requiredFields = ['branchId', 'date', 'time'];
      const missingFields = requiredFields.filter(field => !state.bookingData[field as keyof typeof state.bookingData]);
      
      if (missingFields.length > 0) {
        Alert.alert('Missing Required Information', `Please complete: ${missingFields.join(', ')}`);
        return;
      }

      // Validation 12: Check if appointment time is in the future
      const appointmentDateTime = new Date(`${state.bookingData.date}T${state.bookingData.time}`);
      const now = new Date();
      
      if (appointmentDateTime <= now) {
        Alert.alert('Invalid Appointment Time', 'Please select a future date and time for your appointment.');
        return;
      }

      // Validation 13: Check if appointment is within business hours (optional - can be customized)
      const appointmentHour = appointmentDateTime.getHours();
      if (appointmentHour < 8 || appointmentHour > 20) {
        Alert.alert('Outside Business Hours', 'Please select a time between 8:00 AM and 8:00 PM.');
        return;
      }

      // Prepare appointment data to match your normalized database structure
      // Handle multiple services with their assigned stylists
      const serviceStylistPairs = state.bookingData.selectedServices?.map(service => {
        const stylist = state.bookingData.selectedStylists?.[service.id];
        return {
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          stylistId: stylist?.id || state.bookingData.stylistId || '',
          stylistName: stylist ? `${stylist.firstName} ${stylist.lastName}` : state.bookingData.stylistName || ''
        };
      }) || [];

      // If single service (fallback), create serviceStylistPairs array
      if (serviceStylistPairs.length === 0 && state.bookingData.serviceId) {
        serviceStylistPairs.push({
          serviceId: state.bookingData.serviceId,
          serviceName: state.bookingData.serviceName || 'Service',
          servicePrice: state.bookingData.servicePrice || 0,
          stylistId: state.bookingData.stylistId || '',
          stylistName: state.bookingData.stylistName || ''
        });
      }

      const appointmentData = {
        appointmentDate: state.bookingData.date || '',
        appointmentTime: state.bookingData.time || '',
        branchId: state.bookingData.branchId || '',
        clientEmail: user?.email || '',
        clientId: user?.id || '',
        clientName: user?.name || 'Client',
        clientPhone: user?.phone || '',
        createdAt: new Date(),
        createdBy: user?.id || '',
        history: [{
          action: "created",
          by: user?.id || '',
          notes: "Appointment created",
          timestamp: new Date().toISOString()
        }],
        notes: notes || '',
        serviceStylistPairs: serviceStylistPairs,
        status: "scheduled",
        totalPrice: getTotalPrice(),
        updatedAt: new Date()
      };

      // Validation 14: Final appointment data validation
      if (!appointmentData.serviceStylistPairs || appointmentData.serviceStylistPairs.length === 0) {
        Alert.alert('No Services', 'No services selected for this appointment.');
        return;
      }

      if (!appointmentData.serviceStylistPairs[0]?.stylistId) {
        Alert.alert('No Stylist', 'No stylist assigned to this appointment.');
        return;
      }

      // Validation 15: Ensure each service has a stylist assigned
      const servicesWithoutStylists = serviceStylistPairs.filter(pair => !pair.stylistId);
      if (servicesWithoutStylists.length > 0) {
        Alert.alert('Stylist Assignment Required', 'All services must have a stylist assigned.');
        return;
      }

      // Create appointment
      const appointmentId = await MobileAppointmentService.createAppointment(appointmentData);
      
      console.log('✅ Appointment created successfully with ID:', appointmentId);
      
      Alert.alert(
        'Appointment Booked Successfully!',
        `Your appointment has been confirmed for ${state.bookingData.date} at ${state.bookingData.time}.`,
        [
          {
            text: 'Go to Dashboard',
            onPress: () => {
              resetBooking(); // Clear booking context
              // Navigate back to the main screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      // Validation 15: Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          Alert.alert('Network Error', 'Please check your internet connection and try again.');
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          Alert.alert('Permission Denied', 'You do not have permission to create this appointment. Please log in again.');
        } else if (error.message.includes('conflict') || error.message.includes('duplicate')) {
          Alert.alert('Appointment Conflict', 'There may be a scheduling conflict. Please try a different time.');
        } else if (error.message.includes('validation') || error.message.includes('invalid')) {
          Alert.alert('Invalid Data', 'Some appointment information is invalid. Please go back and check your selections.');
        } else {
          Alert.alert('Booking Error', `Failed to book appointment: ${error.message}`);
        }
      } else {
        Alert.alert('Unknown Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    setNotesError(null);
    
    // Validation: Check notes length
    if (text.length > 500) {
      setNotesError('Notes cannot exceed 500 characters');
    } else if (text.trim().length === 0 && text.length > 0) {
      setNotesError('Notes cannot contain only spaces');
    } else {
      setNotesError(null);
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
                  <Text style={styles.infoValue}>{user?.name || 'Not provided'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>Not provided</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
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
                  <Text style={styles.infoValue}>{state.bookingData.branchName}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(state.bookingData.date || '')}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>{formatTime(state.bookingData.time || '')}</Text>
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
                {state.bookingData.selectedServices && state.bookingData.selectedServices.length > 0 ? (
                  // Display all selected services
                  state.bookingData.selectedServices.map((service, index) => {
                    const stylist = state.bookingData.selectedStylists?.[service.id];
                    return (
                      <View key={service.id} style={styles.serviceItem}>
                        <View style={styles.serviceInfo}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          <Text style={styles.serviceCategory}>{service.category}</Text>
                          <Text style={styles.serviceDuration}>{service.duration} min</Text>
                        </View>
                        <View style={styles.serviceDetails}>
                          <Text style={styles.stylistName}>
                            with {stylist?.name || 'No stylist assigned'}
                          </Text>
                          <Text style={styles.servicePrice}>₱{service.price}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  // Fallback to single service display
                  <View style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{state.bookingData.serviceName}</Text>
                      <Text style={styles.serviceCategory}>General</Text>
                      <Text style={styles.serviceDuration}>{state.bookingData.serviceDuration} min</Text>
                    </View>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.stylistName}>
                        with {state.bookingData.stylistName || 'No stylist assigned'}
                      </Text>
                      <Text style={styles.servicePrice}>₱{state.bookingData.servicePrice}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionHeader}>Additional Notes</Text>
              <TextInput
                style={[styles.notesInput, notesError && styles.notesInputError]}
                value={notes}
                onChangeText={handleNotesChange}
                placeholder="Add any special requests or notes for your appointment..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              {notesError && (
                <Text style={styles.notesErrorText}>{notesError}</Text>
              )}
              <Text style={styles.notesCharCount}>{notes.length}/500 characters</Text>
            </View>

            {/* Total Cost */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <View style={styles.totalLabelContainer}>
                  <Text style={styles.totalLabel}>Total Price</Text>
                  <View style={styles.estimateBadge}>
                    <Text style={styles.estimateBadgeText}>ESTIMATE</Text>
                  </View>
                </View>
                <Text style={styles.totalValue}>₱{getTotalPrice()}</Text>
              </View>
              <Text style={styles.totalNote}>* Final cost may vary based on service complexity and additional requirements</Text>
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
                  <Text style={styles.infoValue}>{user?.name || 'Not provided'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>Not provided</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
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
                  <Text style={styles.infoValue}>{state.bookingData.branchName}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(state.bookingData.date || '')}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>{formatTime(state.bookingData.time || '')}</Text>
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
                {state.bookingData.selectedServices && state.bookingData.selectedServices.length > 0 ? (
                  // Display all selected services
                  state.bookingData.selectedServices.map((service, index) => {
                    const stylist = state.bookingData.selectedStylists?.[service.id];
                    return (
                      <View key={service.id} style={styles.serviceItem}>
                        <View style={styles.serviceInfo}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          <Text style={styles.serviceCategory}>{service.category}</Text>
                          <Text style={styles.serviceDuration}>{service.duration} min</Text>
                        </View>
                        <View style={styles.serviceDetails}>
                          <Text style={styles.stylistName}>
                            with {stylist?.name || 'No stylist assigned'}
                          </Text>
                          <Text style={styles.servicePrice}>₱{service.price}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  // Fallback to single service display
                  <View style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{state.bookingData.serviceName}</Text>
                      <Text style={styles.serviceCategory}>General</Text>
                      <Text style={styles.serviceDuration}>{state.bookingData.serviceDuration} min</Text>
                    </View>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.stylistName}>
                        with {state.bookingData.stylistName || 'No stylist assigned'}
                      </Text>
                      <Text style={styles.servicePrice}>₱{state.bookingData.servicePrice}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionHeader}>Additional Notes</Text>
              <TextInput
                style={[styles.notesInput, notesError && styles.notesInputError]}
                value={notes}
                onChangeText={handleNotesChange}
                placeholder="Add any special requests or notes for your appointment..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              {notesError && (
                <Text style={styles.notesErrorText}>{notesError}</Text>
              )}
              <Text style={styles.notesCharCount}>{notes.length}/500 characters</Text>
            </View>

            {/* Total Cost */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <View style={styles.totalLabelContainer}>
                  <Text style={styles.totalLabel}>Total Price</Text>
                  <View style={styles.estimateBadge}>
                    <Text style={styles.estimateBadgeText}>ESTIMATE</Text>
                  </View>
                </View>
                <Text style={styles.totalValue}>₱{getTotalPrice()}</Text>
              </View>
              <Text style={styles.totalNote}>* Final cost may vary based on service complexity and additional requirements</Text>
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

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="calendar" size={32} color={APP_CONFIG.primaryColor} />
              <Text style={styles.modalTitle}>Confirm Appointment</Text>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Are you sure you want to book this appointment?
              </Text>
              
              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{state.bookingData.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{state.bookingData.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Branch:</Text>
                  <Text style={styles.detailValue}>
                    {state.bookingData.branchName || getBranchName(state.bookingData.branchId)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total:</Text>
                  <Text style={styles.detailValue}>₱{getTotalPrice()}</Text>
                </View>
                {state.bookingData.selectedServices && state.bookingData.selectedServices.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Services & Stylists:</Text>
                    <View style={styles.serviceStylistList}>
                      {state.bookingData.selectedServices.map((service, index) => {
                        const stylist = state.bookingData.selectedStylists?.[service.id];
                        return (
                          <Text key={index} style={styles.serviceStylistItem}>
                            {service.name} → {stylist ? `${stylist.firstName} ${stylist.lastName}` : 'No stylist assigned'}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                )}
                {notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.detailValue}>{notes}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmAppointment}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  notesSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
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
  totalLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  estimateBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  estimateBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#D97706',
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
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#374151',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  notesInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  notesErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  notesCharCount: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'right',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  appointmentDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: APP_CONFIG.primaryColor,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  serviceStylistList: {
    marginTop: 8,
  },
  serviceStylistItem: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 16,
  },
});
