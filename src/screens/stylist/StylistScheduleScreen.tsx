import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistButton,
  StylistSection,
  StylistPageTitle,
  StylistBadge,
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';
import { Appointment } from '../../types';

const { width } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

export default function StylistScheduleScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  interface TimeSlot {
    id: number;
    time: string;
    client?: string;
    service?: string;
    status?: 'confirmed' | 'pending';
    type: 'appointment' | 'available' | 'blocked';
  }

  const todaySchedule: TimeSlot[] = [
    {
      id: 1,
      time: '9:00 AM',
      client: 'Sarah Johnson',
      service: 'Balayage',
      status: 'confirmed',
      type: 'appointment',
    },
    {
      id: 2,
      time: '11:00 AM',
      type: 'blocked',
    },
    {
      id: 3,
      time: '1:00 PM',
      client: 'Lisa Chen',
      service: 'Color Correction',
      status: 'confirmed',
      type: 'appointment',
    },
    {
      id: 4,
      time: '3:00 PM',
      type: 'blocked',
    },
    {
      id: 5,
      time: '5:00 PM',
      client: 'Amanda Rodriguez',
      service: 'Root Touch-up',
      status: 'confirmed',
      type: 'appointment',
    },
    {
      id: 6,
      time: '7:00 PM',
      type: 'blocked',
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDateSelect = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const handleViewSchedule = () => {
    console.log('View schedule');
  };

  const handleUpdateAvailability = () => {
    console.log('Update availability');
  };

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Schedule Management Header */}
        <StylistSection isTitle>
          <StylistPageTitle title="Schedule Management" />
        </StylistSection>

        {/* Date Picker */}
        <StylistSection>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity 
              style={styles.dateNavButton}
              onPress={() => handleDateSelect('prev')}
            >
              <Ionicons name="chevron-back" size={24} color="#160B53" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateDisplay}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#160B53" />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateNavButton}
              onPress={() => handleDateSelect('next')}
            >
              <Ionicons name="chevron-forward" size={24} color="#160B53" />
            </TouchableOpacity>
          </View>
        </StylistSection>

        {/* Today's Schedule */}
        <StylistSection>
          <Text style={styles.scheduleDateTitle}>Schedule - {formatDate(selectedDate)}</Text>
          
          <View style={styles.timeSlotGrid}>
            {todaySchedule.map((slot) => (
              <View 
                key={slot.id} 
                style={[
                  styles.timeSlotCard,
                  slot.status === 'confirmed' && styles.timeSlotCardConfirmed
                ]}
              >
                <Text style={styles.timeSlotTime}>{slot.time}</Text>
                {slot.type === 'appointment' ? (
                  <>
                    <Text style={styles.timeSlotClient}>{slot.client}</Text>
                    <Text style={styles.timeSlotService}>{slot.service}</Text>
                    {slot.status && (
                      <StylistBadge label={slot.status} variant={slot.status} size="small" />
                    )}
                  </>
                ) : slot.type === 'blocked' ? (
                  <>
                    <StylistBadge label="Available" variant="default" size="small" />
                    <View style={styles.buttonSpacer} />
                    <StylistButton
                      title="Block Time"
                      onPress={() => console.log('Unblock time:', slot.id)}
                      variant="secondary"
                      icon="lock-closed"
                    />
                  </>
                ) : (
                  <>
                    <StylistBadge label="Available" variant="default" size="small" />
                    <View style={styles.buttonSpacer} />
                    <StylistButton
                      title="Book Appointment"
                      onPress={() => console.log('Book time:', slot.id)}
                      variant="outline"
                      icon="add-circle-outline"
                    />
                  </>
                )}
              </View>
            ))}
          </View>
        </StylistSection>
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Schedule" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Schedule Management Header */}
        <StylistSection isTitle>
          <StylistPageTitle title="Schedule Management" />
        </StylistSection>

        {/* Date Picker */}
        <StylistSection>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity 
              style={styles.dateNavButton}
              onPress={() => handleDateSelect('prev')}
            >
              <Ionicons name="chevron-back" size={24} color="#160B53" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateDisplay}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#160B53" />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateNavButton}
              onPress={() => handleDateSelect('next')}
            >
              <Ionicons name="chevron-forward" size={24} color="#160B53" />
            </TouchableOpacity>
          </View>
        </StylistSection>

        {/* Today's Schedule */}
        <StylistSection>
          <Text style={styles.scheduleDateTitle}>Schedule - {formatDate(selectedDate)}</Text>
          
          <View style={styles.timeSlotGrid}>
            {todaySchedule.map((slot) => (
              <View 
                key={slot.id} 
                style={[
                  styles.timeSlotCard,
                  slot.status === 'confirmed' && styles.timeSlotCardConfirmed
                ]}
              >
                <Text style={styles.timeSlotTime}>{slot.time}</Text>
                {slot.type === 'appointment' ? (
                  <>
                    <Text style={styles.timeSlotClient}>{slot.client}</Text>
                    <Text style={styles.timeSlotService}>{slot.service}</Text>
                    {slot.status && (
                      <StylistBadge label={slot.status} variant={slot.status} size="small" />
                    )}
                  </>
                ) : slot.type === 'blocked' ? (
                  <>
                    <StylistBadge label="Available" variant="default" size="small" />
                    <View style={styles.buttonSpacer} />
                    <StylistButton
                      title="Block Time"
                      onPress={() => console.log('Unblock time:', slot.id)}
                      variant="secondary"
                      icon="lock-closed"
                    />
                  </>
                ) : (
                  <>
                    <StylistBadge label="Available" variant="default" size="small" />
                    <View style={styles.buttonSpacer} />
                    <StylistButton
                      title="Book Appointment"
                      onPress={() => console.log('Book time:', slot.id)}
                      variant="outline"
                      icon="add-circle-outline"
                    />
                  </>
                )}
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
    fontFamily: 'Poppins_600SemiBold',
  },
  headerDate: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
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
  upcomingSection: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: Platform.OS === 'web' ? 24 : 20,
    paddingTop: 0,
  },
  sectionCard: {
    backgroundColor: Platform.OS === 'web' ? '#FFFFFF' : 'transparent',
    borderRadius: Platform.OS === 'web' ? 12 : 0,
    padding: Platform.OS === 'web' ? 20 : 0,
    marginBottom: Platform.OS === 'web' ? 24 : 20,
    shadowColor: Platform.OS === 'web' ? '#000000' : 'transparent',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0,
    shadowRadius: Platform.OS === 'web' ? 15 : 0,
    elevation: Platform.OS === 'web' ? 0 : 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 16 : 12,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 15 : Platform.OS === 'android' ? 14 : 16,
    color: Platform.OS === 'web' ? '#000000' : '#160B53',
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : 'Poppins_600SemiBold',
  },
  myAppointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 0 : 20,
    marginBottom: 12,
  },
  myAppointmentsTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : Platform.OS === 'android' ? 16 : 20,
    color: Platform.OS === 'web' ? '#160B53' : '#160B53',
    fontFamily: Platform.OS === 'web' ? 'Poppins_700Bold' : 'Poppins_700Bold',
    marginBottom: Platform.OS === 'web' ? 16 : 12,
  },
  bookButton: {
    backgroundColor: '#160B53',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    borderRadius: Platform.OS === 'web' ? 8 : 12,
    marginBottom: Platform.OS === 'web' ? 0 : 8,
    width: Platform.OS === 'web' ? 240 : undefined,
    height: Platform.OS === 'web' ? 44 : undefined,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 14 : 16,
    marginLeft: 8,
    fontFamily: Platform.OS === 'web' ? 'Poppins_500Medium' : 'Poppins_600SemiBold',
  },
  filterSection: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: Platform.OS === 'web' ? 24 : 20,
    paddingTop: 0,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterDropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterDropdownText: {
    color: '#374151',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 14 : 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
    width: Platform.OS === 'web' ? '100%' : undefined,
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentService: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? FONTS.medium : 'Poppins_600SemiBold',
  },
  appointmentStylist: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },
  appointmentInfo: {
    gap: 4,
  },
  appointmentInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentInfoText: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'Poppins_400Regular',
  },
  appointmentRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' ? 8 : Platform.OS === 'ios' ? 9 : 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rescheduleButton: {
    backgroundColor: '#160B53',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
    borderRadius: 6,
  },
  rescheduleButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 12 : 10,
    fontFamily: Platform.OS === 'web' ? FONTS.medium : 'Poppins_600SemiBold',
  },
  cancelButton: {
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#160B53',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#160B53',
    fontSize: Platform.OS === 'web' ? 12 : 10,
    fontFamily: Platform.OS === 'web' ? FONTS.medium : 'Poppins_600SemiBold',
  },
  // Filter modal styles
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  filterModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    maxWidth: 360,
  },
  filterTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#160B53',
    marginBottom: 10,
  },
  filterGroup: {
    gap: 8,
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  filterOptionActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  filterOptionText: {
    color: '#374151',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  filterOptionTextActive: {
    color: '#160B53',
    fontFamily: 'Poppins_600SemiBold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: Platform.OS === 'android' ? 18 : Platform.OS === 'ios' ? 19 : 20,
    color: '#160B53',
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : 'Poppins_700Bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalAppointmentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 18 : 20,
    marginBottom: 30,
  },
  modalAppointmentLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalAppointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalAppointmentDetails: {
    flex: 1,
  },
  modalAppointmentService: {
    fontSize: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 17 : 18,
    color: '#160B53',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? FONTS.medium : 'Poppins_600SemiBold',
  },
  modalAppointmentStylist: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  modalAppointmentInfo: {
    gap: 8,
  },
  modalAppointmentInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAppointmentInfoText: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
  },
  modalStatusBadge: {
    alignItems: 'flex-start',
  },
  modalActions: {
    gap: 12,
  },
  modalRescheduleButton: {
    backgroundColor: '#160B53',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalRescheduleButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    marginLeft: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalCancelButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#160B53',
  },
  modalCancelButtonText: {
    color: '#160B53',
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    marginLeft: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  // Missing styles for appointment cards
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  clientTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
  },
  priceText: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
  },
  // Schedule Management Styles
  scheduleHeader: {
    marginBottom: 24,
  },
  scheduleTitle: {
    fontSize: Platform.OS === 'web' ? 25 : 18,
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#160B53',
    backgroundColor: '#FFFFFF',
  },
  viewButtonText: {
    fontSize: 13,
    color: '#160B53',
    fontFamily: 'Poppins_500Medium',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#160B53',
  },
  updateButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  scheduleSection: {
    marginBottom: 24,
  },
  scheduleDateTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 15,
    color: '#160B53',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 12,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.OS === 'web' ? 16 : 12,
    justifyContent: 'space-between',
  },
  timeSlotCard: {
    width: Platform.OS === 'web' ? '23%' : '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
  },
  timeSlotCardConfirmed: {
    borderColor: '#160B53',
    borderWidth: 2,
  },
  timeSlotTime: {
    fontSize: 16,
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
  },
  timeSlotClient: {
    fontSize: 14,
    color: '#4F46E5',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  timeSlotService: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
  },
  timeSlotStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  timeSlotStatusText: {
    fontSize: 11,
    color: '#065F46',
    fontFamily: 'Poppins_500Medium',
  },
  timeSlotBlocked: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginTop: 8,
  },
  timeSlotAvailable: {
    fontSize: 14,
    color: '#10B981',
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  buttonSpacer: {
    height: 12,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateNavButton: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 15,
    color: '#160B53',
    fontFamily: 'Poppins_600SemiBold',
  },
});