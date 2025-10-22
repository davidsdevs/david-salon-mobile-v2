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
import useAuth from '../../hooks/useAuth';
import { Appointment } from '../../types';

const { width } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

export default function StylistAppointmentsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filterOptions = ['All', 'Today', 'Upcoming', 'Completed'];

  // Fetch appointments from Firebase
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await AppointmentService.getStylistAppointments(user.uid);
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.uid]);

  const filteredAppointments = appointments.filter(appointment => {
    const clientName = `${appointment.clientFirstName || ''} ${appointment.clientLastName || ''}`.toLowerCase();
    const serviceName = appointment.service?.name?.toLowerCase() || '';
    
    const matchesSearch = clientName.includes(searchQuery.toLowerCase()) ||
                         serviceName.includes(searchQuery.toLowerCase());
    
    // Check if filter matches status
    const matchesFilter = selectedFilter === 'All' || 
                         appointment.status === selectedFilter.toLowerCase();
    
    return matchesSearch && matchesFilter;
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

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Page Title */}
        <View style={styles.section}>
          <Text style={styles.pageTitle}>Appointment Management</Text>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
            {/* Filter Dropdown */}
          </View>
          {filteredAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentLeft}>
                <View style={styles.appointmentIcon}>
                  <Ionicons name="calendar" size={20} color="#4A90E2" />
                </View>
                <View style={styles.appointmentDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.appointmentService}>{appointment.client}</Text>
                    <StylistBadge
                      label={appointment.clientType}
                      variant={
                        appointment.clientType === 'X - New Client' ? 'new-client' :
                        appointment.clientType === 'R - Regular' ? 'regular' :
                        appointment.clientType === 'TR - Transfer' ? 'transfer' : 'default'
                      }
                      size="small"
                    />
                  </View>
                  <Text style={styles.appointmentStylist}>{appointment.service}</Text>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.appointmentInfoItem}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.appointmentInfoText}>
                        {appointment.time} • {appointment.duration}
                      </Text>
                    </View>
                    <View style={styles.appointmentInfoItem}>
                      <Ionicons name="location" size={14} color="#666" />
                      <Text style={styles.appointmentInfoText}>{appointment.location}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.appointmentRight}>
                <Text style={styles.priceText}>{appointment.price}</Text>
                <StylistBadge
                  label={appointment.status}
                  variant={
                    appointment.status === 'confirmed' ? 'confirmed' :
                    appointment.status === 'pending' ? 'pending' :
                    appointment.status === 'cancelled' ? 'cancelled' : 'default'
                  }
                  size="small"
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Appointments" userType="stylist">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Page Title */}
        <StylistSection isTitle>
          <StylistPageTitle title="Appointment Management" />
        </StylistSection>

        {/* Search and Filters */}
        <StylistSection>
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

        {/* Upcoming Appointments */}
        <StylistSection>
          <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
          {filteredAppointments.map((appointment) => (
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
                    <Text style={styles.appointmentService}>{appointment.client}</Text>
                    <StylistBadge
                      label={appointment.clientType}
                      variant={
                        appointment.clientType === 'X - New Client' ? 'new-client' :
                        appointment.clientType === 'R - Regular' ? 'regular' :
                        appointment.clientType === 'TR - Transfer' ? 'transfer' : 'default'
                      }
                      size="small"
                    />
                  </View>
                  <Text style={styles.appointmentStylist}>{appointment.service}</Text>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.appointmentInfoItem}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.appointmentInfoText}>
                        {appointment.time} • {appointment.duration}
                      </Text>
                    </View>
                    <View style={styles.appointmentInfoItem}>
                      <Ionicons name="location" size={14} color="#666" />
                      <Text style={styles.appointmentInfoText}>{appointment.location}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.appointmentRight}>
                <Text style={styles.priceText}>{appointment.price}</Text>
                <StylistBadge
                  label={appointment.status}
                  variant={
                    appointment.status === 'confirmed' ? 'confirmed' :
                    appointment.status === 'pending' ? 'pending' :
                    appointment.status === 'cancelled' ? 'cancelled' : 'default'
                  }
                  size="small"
                />
              </View>
            </TouchableOpacity>
          ))}
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
                        <Text style={styles.modalClientName}>{selectedAppointment.client}</Text>
                        <StylistBadge
                          label={selectedAppointment.clientType}
                          variant={
                            selectedAppointment.clientType === 'X - New Client' ? 'new-client' :
                            selectedAppointment.clientType === 'R - Regular' ? 'regular' :
                            selectedAppointment.clientType === 'TR - Transfer' ? 'transfer' : 'default'
                          }
                          size="small"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Appointment Details Section */}
                  <View style={styles.modalSection}>
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="cut-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Service</Text>
                        <Text style={styles.modalDetailValue}>{selectedAppointment.service}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="time-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Time & Duration</Text>
                        <Text style={styles.modalDetailValue}>{selectedAppointment.time} • {selectedAppointment.duration}</Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="location-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Location</Text>
                        <Text style={styles.modalDetailValue}>{selectedAppointment.location}</Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="cash-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Price</Text>
                        <Text style={styles.modalDetailValue}>{selectedAppointment.price}</Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Status</Text>
                        <StylistBadge
                          label={selectedAppointment.status}
                          variant={selectedAppointment.status === 'confirmed' ? 'confirmed' : 'pending'}
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
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 25 : 18,
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
});
