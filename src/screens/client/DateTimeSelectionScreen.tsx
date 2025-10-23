import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import { APP_CONFIG, FONTS } from '../../constants';
import MobileAppointmentService from '../../services/mobileAppointmentService';
import { useBooking } from '../../context/BookingContext';

const { width } = Dimensions.get('window');

interface TimeSlot {
  id: number;
  time: string;
  isAvailable: boolean;
  isSelected: boolean;
}

export default function DateTimeSelectionScreen() {
  const navigation = useNavigation();
  const { state, setDateTime, setLoading, setError } = useBooking();
  
  const [selectedDate, setSelectedDate] = useState<string>(state.bookingData.date || '');
  const [selectedTime, setSelectedTime] = useState<string>(state.bookingData.time || '');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoadingLocal] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState<{ [key: string]: boolean }>({});
  const [branchHours, setBranchHours] = useState<any>(null);

  // Generate dates for the next 30 days based on branch hours
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const isOpen = branchHours?.[dayName]?.isOpen || false;
      
      dates.push({
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
        isAvailable: isOpen
      });
    }
    
    return dates;
  };

  // Load branch hours on component mount
  useEffect(() => {
    if (state.bookingData.branchId) {
      loadBranchHours();
    }
  }, [state.bookingData.branchId]);

  const loadBranchHours = async () => {
    try {
      setLoading(true);
      setLoadingLocal(true);
      
      // Get branch hours from booking context or fetch from Firestore
      // For now, we'll use a mock structure - in real implementation, fetch from Firestore
      const mockHours = {
        monday: { open: "09:00", close: "18:00", isOpen: true },
        tuesday: { open: "09:00", close: "18:00", isOpen: true },
        wednesday: { open: "09:00", close: "18:00", isOpen: true },
        thursday: { open: "09:00", close: "18:00", isOpen: true },
        friday: { open: "09:00", close: "18:00", isOpen: true },
        saturday: { open: "09:00", close: "18:00", isOpen: true },
        sunday: { open: "10:00", close: "16:00", isOpen: false }
      };
      
      setBranchHours(mockHours);
    } catch (error) {
      console.error('Error loading branch hours:', error);
      setError('Failed to load branch hours');
    } finally {
      setLoading(false);
      setLoadingLocal(false);
    }
  };

  const dates = generateDates();

  // Generate time slots based on selected date and branch hours
  const generateTimeSlots = (selectedDate?: string): TimeSlot[] => {
    if (!selectedDate || !branchHours) return [];
    
    const slots = [];
    const date = new Date(selectedDate);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = branchHours[dayName];
    
    if (!dayHours || !dayHours.isOpen || !dayHours.open || !dayHours.close) return [];
    
    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
    
    const startTime = openHour * 60 + openMinute;
    const endTime = closeHour * 60 + closeMinute;
    
    for (let timeInMinutes = startTime; timeInMinutes < endTime; timeInMinutes += 30) {
      const hour = Math.floor(timeInMinutes / 60);
      const minute = timeInMinutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const isAvailable = !availabilityChecked[`${selectedDate}-${timeString}`];
      
      slots.push({
        id: timeInMinutes,
        time: timeString,
        isAvailable,
        isSelected: selectedTime === timeString
      });
    }
    
    return slots;
  };

  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(generateTimeSlots(selectedDate));
    }
  }, [selectedDate, branchHours]);

  // Check availability for a specific date and time
  const checkAvailability = async (date: string, time: string) => {
    const key = `${date}-${time}`;
    if (availabilityChecked[key]) return;
    
    try {
      setLoading(true);
      const isAvailable = await MobileAppointmentService.checkTimeSlotAvailability(state.bookingData.branchId || '', date, time);
      setAvailabilityChecked(prev => ({ ...prev, [key]: true }));
      
      setTimeSlots(prev => prev.map(slot => 
        slot.time === time ? { ...slot, isAvailable } : slot
      ));
    } catch (error) {
      console.error('Error checking availability:', error);
      Alert.alert('Error', 'Failed to check availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
    
    // Check availability for all time slots for this date
    timeSlots.forEach(slot => {
      checkAvailability(date, slot.time);
    });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      // Save date and time to booking context
      setDateTime(selectedDate, selectedTime);
      
      // Navigate to next step
      (navigation as any).navigate('ServiceStylistSelection');
    } else {
      Alert.alert('Selection Required', 'Please select both date and time to continue.');
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
            <View style={[styles.stepCircle, styles.activeStep]}>
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
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
        </View>

        {/* Date and Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred appointment date and time</Text>
          
          <View style={styles.selectionContainer}>
            {/* Date Selection */}
            <View style={styles.dateContainer}>
              <Text style={styles.containerTitle}>Select Date</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.datesScrollView}
                contentContainerStyle={styles.datesContent}
              >
                {dates.map((date) => (
                  <TouchableOpacity
                    key={date.date}
                    style={[
                      styles.dateCard,
                      selectedDate === date.date && styles.selectedDateCard,
                      !date.isAvailable && styles.unavailableDateCard
                    ]}
                    onPress={() => date.isAvailable && date.date && handleDateSelect(date.date)}
                    disabled={!date.isAvailable}
                  >
                    <Text style={[
                      styles.dateDayName,
                      selectedDate === date.date && styles.selectedDateText,
                      !date.isAvailable && styles.unavailableText
                    ]}>
                      {date.dayName}
                    </Text>
                    <Text style={[
                      styles.dateDay,
                      selectedDate === date.date && styles.selectedDateText,
                      !date.isAvailable && styles.unavailableText
                    ]}>
                      {date.day}
                    </Text>
                    <Text style={[
                      styles.dateMonth,
                      selectedDate === date.date && styles.selectedDateText,
                      !date.isAvailable && styles.unavailableText
                    ]}>
                      {date.month}
                    </Text>
                    {date.isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayText}>Today</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.timeContainer}>
              <Text style={styles.containerTitle}>Select Time</Text>
              {selectedDate ? (
                (loading || state.isLoading) ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
                    <Text style={styles.loadingText}>Checking availability...</Text>
                  </View>
                ) : (
                  <View style={styles.timeSlotsGrid}>
                    {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.timeSlot,
                        selectedTime === slot.time && styles.selectedTimeSlot,
                        !slot.isAvailable && styles.unavailableTimeSlot
                      ]}
                      onPress={() => slot.isAvailable && handleTimeSelect(slot.time)}
                      disabled={!slot.isAvailable}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTime === slot.time && styles.selectedTimeText,
                        !slot.isAvailable && styles.unavailableText
                      ]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                    ))}
                  </View>
                )
              ) : (
                <View style={styles.noDateSelected}>
                  <Ionicons name="calendar" size={48} color="#CCCCCC" />
                  <Text style={styles.noDateText}>Please select a date first</Text>
                </View>
              )}
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
            style={[
              styles.nextButton,
              (!selectedDate || !selectedTime) && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!selectedDate || !selectedTime}
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
            <View style={[styles.stepCircle, styles.activeStep]}>
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
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
        </View>

        {/* Date and Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred appointment date and time</Text>
          
          <View style={styles.selectionContainer}>
            {/* Date Selection */}
            <View style={styles.dateContainer}>
              <Text style={styles.containerTitle}>Select Date</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.datesScrollView}
                contentContainerStyle={styles.datesContent}
              >
                {dates.map((date) => (
                  <TouchableOpacity
                    key={date.date}
                    style={[
                      styles.dateCard,
                      selectedDate === date.date && styles.selectedDateCard,
                      !date.isAvailable && styles.unavailableDateCard
                    ]}
                    onPress={() => date.isAvailable && date.date && handleDateSelect(date.date)}
                    disabled={!date.isAvailable}
                  >
                    <Text style={[
                      styles.dateDayName,
                      selectedDate === date.date && styles.selectedDateText,
                      !date.isAvailable && styles.unavailableText
                    ]}>
                      {date.dayName}
                    </Text>
                    <Text style={[
                      styles.dateDay,
                      selectedDate === date.date && styles.selectedDateText,
                      !date.isAvailable && styles.unavailableText
                    ]}>
                      {date.day}
                    </Text>
                    <Text style={[
                      styles.dateMonth,
                      selectedDate === date.date && styles.selectedDateText,
                      !date.isAvailable && styles.unavailableText
                    ]}>
                      {date.month}
                    </Text>
                    {date.isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayText}>Today</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.timeContainer}>
              <Text style={styles.containerTitle}>Select Time</Text>
              {selectedDate ? (
                (loading || state.isLoading) ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
                    <Text style={styles.loadingText}>Checking availability...</Text>
                  </View>
                ) : (
                  <View style={styles.timeSlotsGrid}>
                    {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.timeSlot,
                        selectedTime === slot.time && styles.selectedTimeSlot,
                        !slot.isAvailable && styles.unavailableTimeSlot
                      ]}
                      onPress={() => slot.isAvailable && handleTimeSelect(slot.time)}
                      disabled={!slot.isAvailable}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTime === slot.time && styles.selectedTimeText,
                        !slot.isAvailable && styles.unavailableText
                      ]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                    ))}
                  </View>
                )
              ) : (
                <View style={styles.noDateSelected}>
                  <Ionicons name="calendar" size={48} color="#CCCCCC" />
                  <Text style={styles.noDateText}>Please select a date first</Text>
                </View>
              )}
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
            style={[
              styles.nextButton,
              (!selectedDate || !selectedTime) && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!selectedDate || !selectedTime}
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
    gap: 24,
  },
  dateContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 18 : 20,
  },
  timeContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 18 : 20,
  },
  containerTitle: {
    fontSize: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 17 : 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 16,
  },
  datesScrollView: {
    maxHeight: 120,
  },
  datesContent: {
    paddingRight: 16,
  },
  dateCard: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedDateCard: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  unavailableDateCard: {
    opacity: 0.5,
  },
  dateDayName: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#666',
    marginBottom: 2,
  },
  dateDay: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  unavailableText: {
    color: '#999',
  },
  todayBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  todayText: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedTimeSlot: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  unavailableTimeSlot: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#160B53',
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },
  noDateSelected: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDateText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#999',
    marginTop: 12,
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
});
