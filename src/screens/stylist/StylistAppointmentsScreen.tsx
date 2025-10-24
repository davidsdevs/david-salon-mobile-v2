import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistSearchBar,
  StylistFilterTab,
  StylistButton,
  StylistCard,
  StylistBadge,
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';
import { AppointmentService } from '../../services/appointmentService';
import { useAuth } from '../../hooks/redux';
import { Appointment } from '../../types';

const { width } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

export default function StylistAppointmentsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'client'>('time');
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);

  const filterOptions = ['Today', 'Upcoming', 'Scheduled', 'Confirmed', 'In-Service', 'Completed', 'Cancelled'];

  // Set up real-time subscription for appointments
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log('🔄 Setting up real-time subscription for stylist appointments:', user.uid);
    setLoading(true);
    setError(null);

    // Set up real-time listener
    const unsubscribe = AppointmentService.subscribeToStylistAppointments(
      user.uid,
      (updatedAppointments) => {
        console.log('📡 Real-time update received:', updatedAppointments.length, 'appointments');
        setAppointments(updatedAppointments);
        setLoading(false);
        setError(null);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up stylist appointment subscription');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const filteredAppointments = appointments.filter(appointment => {
    // Use real Firebase data fields
    const clientName = appointment.clientName || 
                      `${appointment.clientFirstName || ''} ${appointment.clientLastName || ''}`.trim() ||
                      'Unknown Client';
    const serviceName = appointment.service?.name || 
                       (appointment.services && appointment.services[0]?.name) ||
                       'Unknown Service';
    
    const matchesSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if filter matches status and date
    let matchesFilter = false;
    const appointmentDate = new Date(appointment.appointmentDate || appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    switch (selectedFilter) {
      case 'Today':
        // Today shows ALL appointments scheduled for today (any status)
        matchesFilter = appointmentDate >= today && appointmentDate < tomorrow;
        break;
      case 'Upcoming':
        // Upcoming shows only scheduled appointments from tomorrow onwards (excludes today and cancelled)
        matchesFilter = appointmentDate >= tomorrow && appointment.status === 'scheduled';
        break;
      case 'Scheduled':
        // Scheduled shows all scheduled appointments (any date, excludes cancelled)
        matchesFilter = appointment.status === 'scheduled';
        break;
      case 'Confirmed':
        // Confirmed shows only confirmed appointments
        matchesFilter = appointment.status === 'confirmed';
        break;
      case 'In-Service':
        // In-Service shows only in-service appointments
        matchesFilter = appointment.status === 'in-service';
        break;
      case 'Completed':
        // Completed shows only completed appointments
        matchesFilter = appointment.status === 'completed';
        break;
      case 'Cancelled':
        // Cancelled shows only cancelled appointments
        matchesFilter = appointment.status === 'cancelled';
        break;
      default:
        matchesFilter = true;
    }
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    // Sort appointments based on selected sort option
    switch (sortBy) {
      case 'time':
        // Sort by appointment time
        const timeA = a.appointmentTime || a.startTime || '';
        const timeB = b.appointmentTime || b.startTime || '';
        return timeA.localeCompare(timeB);
      case 'client':
        // Sort by client name
        const clientA = a.clientName || `${a.clientFirstName || ''} ${a.clientLastName || ''}`.trim() || '';
        const clientB = b.clientName || `${b.clientFirstName || ''} ${b.clientLastName || ''}`.trim() || '';
        return clientA.localeCompare(clientB);
      default:
        return 0;
    }
  });

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

  const handleAppointmentPress = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const handleConfirmAppointment = () => {
    Alert.alert(
      'Confirm Appointment',
      `Are you sure you want to confirm this appointment with ${selectedAppointment?.client}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            console.log('Appointment confirmed');
            setModalVisible(false);
          },
          style: 'default',
        },
      ]
    );
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel this appointment with ${selectedAppointment?.client}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          onPress: () => {
            console.log('Appointment cancelled');
            setModalVisible(false);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAppointment(null);
  };

  const handleReschedule = () => {
    // TODO: Implement reschedule functionality
    console.log('Reschedule appointment:', selectedAppointment?.id);
    handleCloseModal();
  };

  const handleCancel = () => {
    // TODO: Implement cancel functionality
    console.log('Cancel appointment:', selectedAppointment?.id);
    handleCloseModal();
  };

  // Helper function to determine client type
  const getClientType = (appointment: any): 'X' | 'TR' | 'R' => {
    // Check if appointment has clientType field
    if (appointment.clientType) {
      if (appointment.clientType === 'new' || appointment.clientType === 'X - New Client') return 'X';
      if (appointment.clientType === 'transfer' || appointment.clientType === 'TR - Transfer') return 'TR';
      if (appointment.clientType === 'regular' || appointment.clientType === 'R - Regular') return 'R';
    }
    // Default to Regular
    return 'R';
  };

  // Helper function to get client type variant for badge
  const getClientTypeVariant = (type: 'X' | 'TR' | 'R') => {
    if (type === 'X') return 'new-client';
    if (type === 'TR') return 'transfer';
    return 'regular';
  };

  // Helper function to get full client type label
  const getFullClientTypeLabel = (type: 'X' | 'TR' | 'R') => {
    if (type === 'X') return 'X - New Client';
    if (type === 'TR') return 'TR - Transfer';
    return 'R - Regular';
  };

  // Mobile-first responsive layout
  return (
    <ScreenWrapper title="Appointments" userType="stylist">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search and Filters */}
        <StylistSection style={styles.searchSection}>
          <StylistSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Appointments"
          />
          
          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterTabs}>
              {filterOptions.map((filter) => {
                const getVariant = () => {
                  if (filter === 'X - New Client') return 'new-client';
                  if (filter === 'R - Regular') return 'regular';
                  if (filter === 'TR - Transfer') return 'transfer';
                  return 'default';
                };
                return (
                  <StylistFilterTab
                    key={filter}
                    label={filter}
                    isActive={selectedFilter === filter}
                    onPress={() => setSelectedFilter(filter)}
                    variant={getVariant()}
                  />
                );
              })}
            </View>
          </ScrollView>
        </StylistSection>

        {/* Appointments List */}
        <StylistSection>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appointments List</Text>
            <View style={styles.sortContainer}>
              <TouchableOpacity 
                style={styles.sortIconButton}
                onPress={() => setSortDropdownVisible(!sortDropdownVisible)}
              >
                <Ionicons name="swap-vertical" size={20} color="#160B53" />
                <Ionicons 
                  name={sortDropdownVisible ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#160B53" 
                />
              </TouchableOpacity>
              
              {sortDropdownVisible && (
                <View style={styles.sortDropdown}>
                  <TouchableOpacity 
                    style={[styles.sortDropdownItem, sortBy === 'time' && styles.sortDropdownItemActive]}
                    onPress={() => {
                      setSortBy('time');
                      setSortDropdownVisible(false);
                    }}
                  >
                    <Ionicons name="time-outline" size={18} color={sortBy === 'time' ? '#160B53' : '#6B7280'} />
                    <Text style={[styles.sortDropdownText, sortBy === 'time' && styles.sortDropdownTextActive]}>
                      Sort by Time
                    </Text>
                    {sortBy === 'time' && <Ionicons name="checkmark" size={18} color="#160B53" />}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.sortDropdownItem, sortBy === 'client' && styles.sortDropdownItemActive]}
                    onPress={() => {
                      setSortBy('client');
                      setSortDropdownVisible(false);
                    }}
                  >
                    <Ionicons name="person-outline" size={18} color={sortBy === 'client' ? '#160B53' : '#6B7280'} />
                    <Text style={[styles.sortDropdownText, sortBy === 'client' && styles.sortDropdownTextActive]}>
                      Sort by Client
                    </Text>
                    {sortBy === 'client' && <Ionicons name="checkmark" size={18} color="#160B53" />}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.emptyStateText}>Loading appointments...</Text>
            </View>
          ) : filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Appointments</Text>
              <Text style={styles.emptyStateText}>
                {selectedFilter === 'Today' ? 'You have no appointments scheduled for today.' :
                 selectedFilter === 'Upcoming' ? 'You have no upcoming scheduled appointments.' :
                 selectedFilter === 'Confirmed' ? 'You have no confirmed appointments.' :
                 selectedFilter === 'In-Service' ? 'You have no appointments in service.' :
                 selectedFilter === 'Completed' ? 'You have no completed appointments.' :
                 selectedFilter === 'Cancelled' ? 'You have no cancelled appointments.' :
                 'No appointments found.'}
              </Text>
            </View>
          ) : (
            filteredAppointments.map((appointment) => (
            <TouchableOpacity 
              key={appointment.id} 
              style={styles.appointmentCard}
              onPress={() => handleAppointmentPress(appointment)}
            >
              <View style={styles.appointmentLeft}>
                <View style={styles.appointmentIcon}>
                  <Ionicons name="calendar" size={20} color="#4A90E2" />
                </View>
                <View style={styles.appointmentDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.appointmentService}>
                      {appointment.clientName || 
                       `${appointment.clientFirstName || ''} ${appointment.clientLastName || ''}`.trim() ||
                       'Unknown Client'}
                    </Text>
                    <StylistBadge
                      label={getClientType(appointment)}
                      variant={getClientTypeVariant(getClientType(appointment))}
                      size="small"
                    />
                  </View>
                  {/* Service Display - Only show count for multiple services */}
                  {(appointment as any).serviceStylistPairs && (appointment as any).serviceStylistPairs.length > 0 ? (
                    <Text style={styles.appointmentStylist}>
                      {(appointment as any).serviceStylistPairs.length === 1 
                        ? (appointment as any).serviceStylistPairs[0].serviceName
                        : `${(appointment as any).serviceStylistPairs.length} Services`}
                    </Text>
                  ) : (
                    <Text style={styles.appointmentStylist}>
                      {appointment.service?.name || 
                       (appointment.services && appointment.services[0]?.name) ||
                       'Unknown Service'}
                    </Text>
                  )}
                  <View style={styles.appointmentInfo}>
                    <View style={styles.appointmentInfoItem}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.appointmentInfoText}>
                        {appointment.appointmentTime || appointment.startTime || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.appointmentRight}>
                <Text style={styles.priceText}>
                  ₱{(() => {
                    // Calculate total price from serviceStylistPairs if available
                    if ((appointment as any).serviceStylistPairs && (appointment as any).serviceStylistPairs.length > 0) {
                      const total = (appointment as any).serviceStylistPairs.reduce(
                        (sum: number, pair: any) => sum + (pair.servicePrice || 0), 
                        0
                      );
                      return total.toFixed(2);
                    }
                    // Fallback to existing price fields
                    return (appointment.price || appointment.finalPrice || 0).toFixed(2);
                  })()}
                </Text>
                <StylistBadge
                  label={
                    appointment.status === 'confirmed' ? 'Confirmed' :
                    appointment.status === 'scheduled' ? 'Scheduled' :
                    appointment.status === 'in_service' ? 'In Service' :
                    appointment.status === 'completed' ? 'Completed' :
                    appointment.status === 'cancelled' ? 'Cancelled' : appointment.status
                  }
                  variant={
                    appointment.status === 'confirmed' ? 'confirmed' :
                    appointment.status === 'scheduled' ? 'scheduled' :
                    appointment.status === 'in_service' ? 'in-service' :
                    appointment.status === 'completed' ? 'completed' :
                    appointment.status === 'cancelled' ? 'cancelled' : 'default'
                  }
                  size="small"
                />
              </View>
            </TouchableOpacity>
          )))}
        </StylistSection>

        {/* Appointment Details Modal */}
        <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={handleCloseModal}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Appointment Details</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedAppointment && (
                <>
                  {/* Client Info Section */}
                  <View style={styles.modalSection}>
                    <View style={styles.modalClientHeader}>
                      <View style={styles.modalClientAvatar}>
                        <Ionicons name="person" size={32} color="#160B53" />
                      </View>
                      <View style={styles.modalClientInfo}>
                        <Text style={styles.modalClientName}>
                          {selectedAppointment.clientName || 
                           `${selectedAppointment.clientFirstName || ''} ${selectedAppointment.clientLastName || ''}`.trim() ||
                           'Unknown Client'}
                        </Text>
                        <StylistBadge
                          label={getFullClientTypeLabel(getClientType(selectedAppointment))}
                          variant={getClientTypeVariant(getClientType(selectedAppointment))}
                          size="small"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Appointment Details Section */}
                  <View style={styles.modalSection}>
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Date</Text>
                        <Text style={styles.modalDetailValue}>
                          {selectedAppointment.appointmentDate 
                            ? new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : selectedAppointment.date 
                              ? new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="cut-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>
                          {(selectedAppointment as any).serviceStylistPairs && (selectedAppointment as any).serviceStylistPairs.length > 1 
                            ? 'Services' 
                            : 'Service'}
                        </Text>
                        {(selectedAppointment as any).serviceStylistPairs && (selectedAppointment as any).serviceStylistPairs.length > 0 ? (
                          <View>
                            {(selectedAppointment as any).serviceStylistPairs.map((pair: any, index: number) => (
                              <Text key={index} style={styles.modalDetailValue}>
                                {(selectedAppointment as any).serviceStylistPairs.length > 1 ? '\u2022 ' : ''}{pair.serviceName} (\u20b1{pair.servicePrice})
                              </Text>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.modalDetailValue}>
                            {selectedAppointment.service?.name || 
                             (selectedAppointment.services && selectedAppointment.services[0]?.name) ||
                             'Unknown Service'}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="time-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Time</Text>
                        <Text style={styles.modalDetailValue}>
                          {selectedAppointment.appointmentTime || selectedAppointment.startTime || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="cash-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Price</Text>
                        <Text style={styles.modalDetailValue}>
                          ₱{selectedAppointment.price || selectedAppointment.finalPrice || 0}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="document-text-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Notes</Text>
                        <Text style={styles.modalDetailValue}>
                          {selectedAppointment.notes || 'No notes'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Status</Text>
                        <StylistBadge
                          label={
                            selectedAppointment.status === 'confirmed' ? 'Confirmed' :
                            selectedAppointment.status === 'scheduled' ? 'Scheduled' :
                            selectedAppointment.status === 'in_service' ? 'In Service' :
                            selectedAppointment.status === 'completed' ? 'Completed' :
                            selectedAppointment.status === 'cancelled' ? 'Cancelled' : selectedAppointment.status
                          }
                          variant={
                            selectedAppointment.status === 'confirmed' ? 'confirmed' :
                            selectedAppointment.status === 'scheduled' ? 'scheduled' :
                            selectedAppointment.status === 'in_service' ? 'in-service' :
                            selectedAppointment.status === 'completed' ? 'completed' :
                            selectedAppointment.status === 'cancelled' ? 'cancelled' : 'default'
                          }
                          size="small"
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
  },
  titleSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
    paddingTop: Platform.OS === 'android' ? 24 : 20,
  },
  sectionCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: 20,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'ios' ? 15 : Platform.OS === 'android' ? 14 : 16,
    color: '#160B53',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 16,
  },
  sortContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  sortIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sortDropdown: {
    position: 'absolute',
    top: 45,
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
  pageTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  appointmentService: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? FONTS.medium : 'Poppins_600SemiBold',
  },
  clientTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    fontSize: 10,
    color: '#1976D2',
  },
  appointmentStylist: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },
  servicesList: {
    marginTop: 4,
    marginBottom: 4,
  },
  serviceItem: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    color: '#888',
    marginLeft: 8,
    marginTop: 2,
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
  priceText: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' ? 8 : Platform.OS === 'ios' ? 9 : 10,
    fontFamily: 'Poppins_600SemiBold',
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
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    color: '#666',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  // Enhanced Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 520,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalClientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalClientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClientInfo: {
    flex: 1,
    gap: 6,
  },
  modalClientName: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  modalClientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  modalDetailContent: {
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  modalDetailValue: {
    fontSize: 15,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  modalActionButton: {
    flex: 1,
  },
  confirmedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  confirmedButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontFamily: FONTS.semiBold,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONTS.medium,
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
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});
