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
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { APP_CONFIG, FONTS } from '../../constants';
import { Appointment } from '../../types/api';
import { useAuth } from '../../hooks/redux';
import AppointmentService from '../../services/appointmentService';

const { width } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

export default function AppointmentsScreen() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const navigation = useNavigation();
  const { user } = useAuth();

  // Load appointments on component mount
  useEffect(() => {
    if (user?.id) {
      loadAppointments();
      setupRealtimeSubscription();
    }
  }, [user?.id]);

  const loadAppointments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const clientAppointments = await AppointmentService.getClientAppointments(user.id);
      setAppointments(clientAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    const unsubscribe = AppointmentService.subscribeToClientAppointments(
      user.id,
      (updatedAppointments) => {
        setAppointments(updatedAppointments);
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'upcoming':
        return appointmentDate >= today && appointment.status !== 'cancelled';
      case 'past':
        return appointmentDate < today || appointment.status === 'completed';
      case 'all':
      default:
        return true;
    }
  });

  // Sort appointments by date and time
  const sortedAppointments = filteredAppointments.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.startTime}`);
    const dateB = new Date(`${b.date} ${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  const handleAppointmentPress = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAppointment(null);
  };

  const handleReschedule = () => {
    if (!selectedAppointment) return;
    
    Alert.alert(
      'Reschedule Appointment',
      'This will redirect you to the booking screen to reschedule your appointment.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reschedule', 
          onPress: () => {
            // Navigate to booking screen with appointment data
            (navigation as any).navigate('Booking', { 
              rescheduleAppointment: selectedAppointment 
            });
            handleCloseModal();
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    if (!selectedAppointment) return;
    
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AppointmentService.cancelAppointment(selectedAppointment.id, 'Cancelled by client');
              Alert.alert('Success', 'Appointment cancelled successfully');
              handleCloseModal();
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          }
        }
      ]
    );
  };

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* My Appointments Section */}
        <View style={styles.section}>
          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
              onPress={() => setFilter('upcoming')}
            >
              <Text style={[styles.filterButtonText, filter === 'upcoming' && styles.filterButtonTextActive]}>
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
              onPress={() => setFilter('past')}
            >
              <Text style={[styles.filterButtonText, filter === 'past' && styles.filterButtonTextActive]}>
                Past
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {filter === 'upcoming' ? 'Upcoming Appointments' : 
             filter === 'past' ? 'Past Appointments' : 'All Appointments'}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.loadingText}>Loading appointments...</Text>
            </View>
          ) : sortedAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No appointments found</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'upcoming' ? 'You have no upcoming appointments' :
                 filter === 'past' ? 'You have no past appointments' : 'You have no appointments yet'}
              </Text>
            </View>
          ) : (
            sortedAppointments.map((appointment) => (
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
                    <Text style={styles.appointmentService}>
                      {appointment.service?.name || 'Service'}
                    </Text>
                    <Text style={styles.appointmentStylist}>
                      with {appointment.stylist?.firstName} {appointment.stylist?.lastName}
                    </Text>
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {AppointmentService.formatDate(appointment.date)} at {AppointmentService.formatTime(appointment.startTime)}
                        </Text>
                      </View>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="location" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {appointment.branch?.name || 'Branch'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.appointmentRight}>
                  <View style={[styles.statusBadge, { backgroundColor: AppointmentService.getStatusColor(appointment.status) }]}>
                    <Text style={styles.statusText}>
                      {AppointmentService.getStatusText(appointment.status)}
                    </Text>
                  </View>
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.rescheduleButton}
                        onPress={() => {
                          setSelectedAppointment(appointment);
                          handleReschedule();
                        }}
                      >
                        <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                          setSelectedAppointment(appointment);
                          handleCancel();
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <View style={styles.mainContainer}>
      <ScreenWrapper title="My Appointments">
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* My Appointments Section */}
        <View style={styles.section}>
          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
              onPress={() => setFilter('upcoming')}
            >
              <Text style={[styles.filterButtonText, filter === 'upcoming' && styles.filterButtonTextActive]}>
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
              onPress={() => setFilter('past')}
            >
              <Text style={[styles.filterButtonText, filter === 'past' && styles.filterButtonTextActive]}>
                Past
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {filter === 'upcoming' ? 'Upcoming Appointments' : 
             filter === 'past' ? 'Past Appointments' : 'All Appointments'}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.loadingText}>Loading appointments...</Text>
            </View>
          ) : sortedAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No appointments found</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'upcoming' ? 'You have no upcoming appointments' :
                 filter === 'past' ? 'You have no past appointments' : 'You have no appointments yet'}
              </Text>
            </View>
          ) : (
            sortedAppointments.map((appointment) => (
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
                    <Text style={styles.appointmentService}>
                      {appointment.service?.name || 'Service'}
                    </Text>
                    <Text style={styles.appointmentStylist}>
                      with {appointment.stylist?.firstName} {appointment.stylist?.lastName}
                    </Text>
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {AppointmentService.formatDate(appointment.date)} at {AppointmentService.formatTime(appointment.startTime)}
                        </Text>
                      </View>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="location" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {appointment.branch?.name || 'Branch'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.appointmentRight}>
                  <View style={[styles.statusBadge, { backgroundColor: AppointmentService.getStatusColor(appointment.status) }]}>
                    <Text style={styles.statusText}>
                      {AppointmentService.getStatusText(appointment.status)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Appointment Details Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Appointment Details</Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              {selectedAppointment && (
                <>
                  <View style={styles.modalAppointmentCard}>
                    <View style={styles.modalAppointmentLeft}>
                      <View style={styles.modalAppointmentIcon}>
                        <Ionicons name="calendar" size={24} color="#4A90E2" />
                      </View>
                      <View style={styles.modalAppointmentDetails}>
                        <Text style={styles.modalAppointmentService}>
                          {selectedAppointment.service?.name || 'Service'}
                        </Text>
                        <Text style={styles.modalAppointmentStylist}>
                          with {selectedAppointment.stylist?.firstName} {selectedAppointment.stylist?.lastName}
                        </Text>
                        <View style={styles.modalAppointmentInfo}>
                          <View style={styles.modalAppointmentInfoItem}>
                            <Ionicons name="time" size={16} color="#666" />
                            <Text style={styles.modalAppointmentInfoText}>
                              {AppointmentService.formatDate(selectedAppointment.date)} at {AppointmentService.formatTime(selectedAppointment.startTime)}
                            </Text>
                          </View>
                          <View style={styles.modalAppointmentInfoItem}>
                            <Ionicons name="location" size={16} color="#666" />
                            <Text style={styles.modalAppointmentInfoText}>
                              {selectedAppointment.branch?.name || 'Branch'}
                            </Text>
                          </View>
                          {selectedAppointment.service?.price && (
                            <View style={styles.modalAppointmentInfoItem}>
                              <Ionicons name="card" size={16} color="#666" />
                              <Text style={styles.modalAppointmentInfoText}>
                                ₱{selectedAppointment.finalPrice || selectedAppointment.service.price}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.modalStatusBadge}>
                      <View style={[styles.statusBadge, { backgroundColor: AppointmentService.getStatusColor(selectedAppointment.status) }]}>
                        <Text style={styles.statusText}>
                          {AppointmentService.getStatusText(selectedAppointment.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalRescheduleButton} onPress={handleReschedule}>
                      <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.modalRescheduleButtonText}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancel}>
                      <Ionicons name="close-circle-outline" size={20} color="#160B53" />
                      <Text style={styles.modalCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
      </ScreenWrapper>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => (navigation as any).navigate('Booking')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#160B53',
    marginBottom: 16,
    fontFamily: 'Poppins_700Bold',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#160B53',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  appointmentStylist: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },
  appointmentInfo: {
    gap: 4,
  },
  appointmentInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentInfoText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins_400Regular',
  },
  appointmentRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rescheduleButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rescheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalAppointmentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAppointmentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAppointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalAppointmentDetails: {
    flex: 1,
  },
  modalAppointmentService: {
    fontSize: 18,
    fontWeight: '600',
    color: '#160B53',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalAppointmentStylist: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  modalAppointmentInfo: {
    gap: 8,
  },
  modalAppointmentInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalAppointmentInfoText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins_400Regular',
  },
  modalStatusBadge: {
    alignItems: 'flex-end',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRescheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  modalRescheduleButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#160B53',
    gap: 8,
  },
  modalCancelButtonText: {
    color: '#160B53',
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  // Filter styles
  filterContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#160B53',
    borderColor: '#160B53',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins_500Medium',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  // Loading and empty states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Poppins_400Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666666',
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999999',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: APP_CONFIG.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1000,
  },
});