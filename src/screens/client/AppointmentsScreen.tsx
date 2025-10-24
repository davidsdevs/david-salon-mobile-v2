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
  Animated,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { APP_CONFIG, FONTS } from '../../constants';
import { Appointment } from '../../types/api';
import { useAuth } from '../../hooks/redux';
import AppointmentService from '../../services/appointmentService';
import RealtimeDebugger from '../../utils/realtimeDebugger';

const { width } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

export default function AppointmentsScreen() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  
  // Debug modal state changes
  useEffect(() => {
    console.log('🔄 Reschedule modal visibility changed:', rescheduleModalVisible);
  }, [rescheduleModalVisible]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [branchNames, setBranchNames] = useState<{ [branchId: string]: string }>({});
  const [serviceNames, setServiceNames] = useState<{ [serviceId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigation = useNavigation();
  const { user } = useAuth();

  // Load appointments on component mount and set up real-time subscription
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Setting up real-time appointment subscription for user:', user.id);
      const unsubscribe = setupRealtimeSubscription();
      
      // Cleanup subscription on unmount
      return () => {
        console.log('🧹 Cleaning up appointment subscription');
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
    
    // Return empty cleanup function if no user
    return () => {};
  }, [user?.id]);


  const loadAppointments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const clientAppointments = await AppointmentService.getClientAppointments(user.id);
      setAppointments(clientAppointments);
      
      // Fetch branch names for all unique branch IDs
      const uniqueBranchIds = [...new Set(clientAppointments.map(apt => apt.branchId).filter(Boolean))];
      if (uniqueBranchIds.length > 0) {
        console.log('🔄 Fetching branch names for:', uniqueBranchIds);
        const branchNamesMap = await AppointmentService.getBranchNames(uniqueBranchIds);
        setBranchNames(branchNamesMap);
      }

      // Fetch service names for all unique service IDs
      const allServiceIds = clientAppointments.flatMap(apt => 
        apt.serviceStylistPairs?.map(pair => pair.serviceId) || []
      ).filter(Boolean);
      const uniqueServiceIds = [...new Set(allServiceIds)];
      if (uniqueServiceIds.length > 0) {
        console.log('🔄 Fetching service names for:', uniqueServiceIds);
        const serviceNamesMap = await AppointmentService.getServiceNames(uniqueServiceIds);
        setServiceNames(serviceNamesMap);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) {
      console.log('⚠️ No user ID available for real-time subscription');
      return;
    }

    console.log('🔄 Setting up real-time subscription for user:', user.id);
    
    // Enable debug mode for troubleshooting
    RealtimeDebugger.enableDebugMode();
    
    // Run diagnosis first
    RealtimeDebugger.diagnoseRealtimeIssues(user.id).then(results => {
      console.log('🔍 Real-time diagnosis results:', results);
      if (results.errors.length > 0) {
        console.error('❌ Real-time issues detected:', results.errors);
        Alert.alert(
          'Real-time Connection Issues',
          `Detected issues with real-time updates:\n${results.errors.join('\n')}\n\nPlease check your internet connection and try refreshing the app.`,
          [{ text: 'OK' }]
        );
      }
    }).catch(error => {
      console.error('❌ Real-time diagnosis failed:', error);
    });
    
    const unsubscribe = AppointmentService.subscribeToClientAppointments(
      user.id,
      async (updatedAppointments) => {
        console.log('📡 Real-time update received:', updatedAppointments.length, 'appointments');
        RealtimeDebugger.log('Real-time update received', {
          appointmentCount: updatedAppointments.length,
          timestamp: new Date().toISOString()
        });
        
        setAppointments(updatedAppointments);
        
        // Fetch branch names for new appointments
        const uniqueBranchIds = [...new Set(updatedAppointments.map(apt => apt.branchId).filter(Boolean))];
        if (uniqueBranchIds.length > 0) {
          console.log('🔄 Fetching branch names for real-time update:', uniqueBranchIds);
          const branchNamesMap = await AppointmentService.getBranchNames(uniqueBranchIds);
          setBranchNames(prev => ({ ...prev, ...branchNamesMap }));
        }

        // Fetch service names for new appointments
        const allServiceIds = updatedAppointments.flatMap(apt => 
          apt.serviceStylistPairs?.map(pair => pair.serviceId) || []
        ).filter(Boolean);
        const uniqueServiceIds = [...new Set(allServiceIds)];
        if (uniqueServiceIds.length > 0) {
          console.log('🔄 Fetching service names for real-time update:', uniqueServiceIds);
          const serviceNamesMap = await AppointmentService.getServiceNames(uniqueServiceIds);
          setServiceNames(prev => ({ ...prev, ...serviceNamesMap }));
        }
        
        setLoading(false);
        setRefreshing(false);
        setLastUpdated(new Date());
      }
    );

    return unsubscribe;
  };

  const onRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    
    try {
      // Force reload appointments
      await loadAppointments();
      
      // Test real-time connection
      if (user?.id) {
        RealtimeDebugger.testRealtimeSubscription(user.id).then(result => {
          console.log('🔍 Manual refresh - real-time test result:', result);
        }).catch(error => {
          console.error('❌ Manual refresh - real-time test failed:', error);
        });
      }
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      Alert.alert('Refresh Failed', 'Unable to refresh appointments. Please check your connection.');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter appointments based on selected filter and status
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate || appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First filter by date/time
    let dateMatch = false;
    switch (filter) {
      case 'upcoming':
        // For upcoming appointments, exclude canceled appointments regardless of date
        dateMatch = appointmentDate >= today && appointment.status !== 'cancelled';
        break;
      case 'past':
        dateMatch = appointmentDate < today;
        break;
      case 'all':
      default:
        dateMatch = true;
    }

    // Then filter by status
    let statusMatch = false;
    if (statusFilter === 'all') {
      statusMatch = true;
    } else {
      statusMatch = appointment.status === statusFilter;
    }

    return dateMatch && statusMatch;
  });

  // Sort appointments by date and time (closest date first)
  const sortedAppointments = filteredAppointments.sort((a, b) => {
    const dateA = new Date(`${a.appointmentDate || a.date} ${a.appointmentTime || a.startTime}`);
    const dateB = new Date(`${b.appointmentDate || b.date} ${b.appointmentTime || b.startTime}`);
    
    // For upcoming appointments, show closest date first
    if (filter === 'upcoming') {
      return dateA.getTime() - dateB.getTime();
    }
    // For past appointments, show most recent first
    else if (filter === 'past') {
      return dateB.getTime() - dateA.getTime();
    }
    // For all appointments, show closest future date first, then past dates
    else {
      const now = new Date();
      const aIsFuture = dateA >= now;
      const bIsFuture = dateB >= now;
      
      if (aIsFuture && !bIsFuture) return -1; // A is future, B is past
      if (!aIsFuture && bIsFuture) return 1;  // A is past, B is future
      if (aIsFuture && bIsFuture) return dateA.getTime() - dateB.getTime(); // Both future, closest first
      return dateB.getTime() - dateA.getTime(); // Both past, most recent first
    }
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
    console.log('🔄 handleReschedule called, selectedAppointment:', selectedAppointment);
    if (!selectedAppointment) {
      console.log('❌ No selected appointment');
      return;
    }
    
    console.log('✅ Setting up reschedule modal for appointment:', selectedAppointment.id);
    
    // Set the initial date and time from the appointment
    const appointmentDate = new Date(selectedAppointment.appointmentDate || selectedAppointment.date);
    const appointmentTime = new Date(`${selectedAppointment.appointmentDate || selectedAppointment.date} ${selectedAppointment.appointmentTime || selectedAppointment.startTime}`);
    
    console.log('📅 Initial date/time:', {
      appointmentDate: appointmentDate.toISOString(),
      appointmentTime: appointmentTime.toISOString()
    });
    
    setSelectedDate(appointmentDate);
    setSelectedTime(appointmentTime);
    setRescheduleNotes('');
    setRescheduleModalVisible(true);
    setModalVisible(false);
    
    console.log('✅ Reschedule modal should be visible now');
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedAppointment) return;
    
    try {
      // Format the new date and time
      const newDate = selectedDate.toISOString().split('T')[0];
      const newTime = selectedTime?.toTimeString().split(' ')[0].substring(0, 5) || '00:00';
      
      console.log('🔄 Rescheduling appointment - Input data:', {
        selectedDate: selectedDate.toISOString(),
        selectedTime: selectedTime?.toISOString(),
        appointmentId: selectedAppointment.id || 'unknown',
        newDate,
        newTime,
        notes: rescheduleNotes
      });
      
      // Update the appointment with new date/time
      if (selectedAppointment.id) {
        await AppointmentService.rescheduleAppointment(
          selectedAppointment.id,
          newDate,
          newTime,
          rescheduleNotes || ''
        );
      } else {
        throw new Error('Appointment ID is missing');
      }
      
      Alert.alert(
        'Reschedule Request Submitted',
        'Your reschedule request has been submitted. You will be placed in a queue and notified once confirmed.',
        [{ text: 'OK', onPress: () => {
          setRescheduleModalVisible(false);
          setSelectedAppointment(null);
        }}]
      );
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert('Error', 'Failed to reschedule appointment. Please try again.');
    }
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
          
          {/* Status Filter */}
          <View style={styles.statusFilterContainer}>
            <Text style={styles.statusFilterLabel}>Status:</Text>
            <View style={styles.statusFilterButtons}>
              <TouchableOpacity 
                style={[styles.statusFilterButton, statusFilter === 'all' && styles.statusFilterButtonActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.statusFilterButtonText, statusFilter === 'all' && styles.statusFilterButtonTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusFilterButton, statusFilter === 'scheduled' && styles.statusFilterButtonActive]}
                onPress={() => setStatusFilter('scheduled')}
              >
                <Text style={[styles.statusFilterButtonText, statusFilter === 'scheduled' && styles.statusFilterButtonTextActive]}>
                  Scheduled
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusFilterButton, statusFilter === 'confirmed' && styles.statusFilterButtonActive]}
                onPress={() => setStatusFilter('confirmed')}
              >
                <Text style={[styles.statusFilterButtonText, statusFilter === 'confirmed' && styles.statusFilterButtonTextActive]}>
                  Confirmed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusFilterButton, statusFilter === 'cancelled' && styles.statusFilterButtonActive]}
                onPress={() => setStatusFilter('cancelled')}
              >
                <Text style={[styles.statusFilterButtonText, statusFilter === 'cancelled' && styles.statusFilterButtonTextActive]}>
                  Cancelled
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              {filter === 'upcoming' ? 'Upcoming Appointments' : 
               filter === 'past' ? 'Past Appointments' : 'All Appointments'}
            </Text>
          </View>
          
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
                      {appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 1 
                        ? `${appointment.serviceStylistPairs.length} Services`
                        : serviceNames[appointment.serviceStylistPairs?.[0]?.serviceId || ''] || 
                          appointment.serviceStylistPairs?.[0]?.serviceId || 'Service'
                      }
                    </Text>
                    <Text style={styles.appointmentStylist}>
                      {appointment.stylist?.firstName || 'Stylist'} {appointment.stylist?.lastName || 'Name'}
                    </Text>
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {AppointmentService.formatDate(appointment.appointmentDate)} • {AppointmentService.formatTime(appointment.appointmentTime)}
                        </Text>
                      </View>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="location" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {branchNames[appointment.branchId || ''] || `Branch ${appointment.branchId || 'Unknown'}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.appointmentRight}>
                  <Text style={styles.priceText}>₱{appointment.finalPrice || appointment.price || 0}</Text>
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
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <View style={styles.mainContainer}>
      <ScreenWrapper title="Appointments">
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* Page Title */}
        <View style={styles.section}>
          <Text style={styles.pageTitle}>My Appointments</Text>
        </View>

        {/* Filters Section */}
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
          
          {/* Status Filter */}
          <View style={styles.statusFilterContainer}>
            <Text style={styles.statusFilterLabel}>Status:</Text>
            <View style={styles.statusFilterButtons}>
              <TouchableOpacity 
                style={[styles.statusFilterButton, statusFilter === 'all' && styles.statusFilterButtonActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.statusFilterButtonText, statusFilter === 'all' && styles.statusFilterButtonTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusFilterButton, statusFilter === 'scheduled' && styles.statusFilterButtonActive]}
                onPress={() => setStatusFilter('scheduled')}
              >
                <Text style={[styles.statusFilterButtonText, statusFilter === 'scheduled' && styles.statusFilterButtonTextActive]}>
                  Scheduled
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusFilterButton, statusFilter === 'confirmed' && styles.statusFilterButtonActive]}
                onPress={() => setStatusFilter('confirmed')}
              >
                <Text style={[styles.statusFilterButtonText, statusFilter === 'confirmed' && styles.statusFilterButtonTextActive]}>
                  Confirmed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusFilterButton, statusFilter === 'cancelled' && styles.statusFilterButtonActive]}
                onPress={() => setStatusFilter('cancelled')}
              >
                <Text style={[styles.statusFilterButtonText, statusFilter === 'cancelled' && styles.statusFilterButtonTextActive]}>
                  Cancelled
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              {filter === 'upcoming' ? 'Upcoming Appointments' : 
               filter === 'past' ? 'Past Appointments' : 'All Appointments'}
            </Text>
          </View>
          
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
                      {appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 1 
                        ? `${appointment.serviceStylistPairs.length} Services`
                        : serviceNames[appointment.serviceStylistPairs?.[0]?.serviceId || ''] || 
                          appointment.serviceStylistPairs?.[0]?.serviceId || 'Service'
                      }
                    </Text>
                    <Text style={styles.appointmentStylist}>
                      {appointment.stylist?.firstName || 'Stylist'} {appointment.stylist?.lastName || 'Name'}
                    </Text>
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {AppointmentService.formatDate(appointment.appointmentDate)} • {AppointmentService.formatTime(appointment.appointmentTime)}
                        </Text>
                      </View>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="location" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {branchNames[appointment.branchId || ''] || `Branch ${appointment.branchId || 'Unknown'}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.appointmentRight}>
                  <Text style={styles.priceText}>₱{appointment.finalPrice || appointment.price || 0}</Text>
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
          animationType="slide"
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
                          {selectedAppointment.serviceStylistPairs && selectedAppointment.serviceStylistPairs.length > 1 
                            ? `${selectedAppointment.serviceStylistPairs.length} Services`
                            : serviceNames[selectedAppointment.serviceStylistPairs?.[0]?.serviceId || ''] || 
                              selectedAppointment.serviceStylistPairs?.[0]?.serviceId || 'Service'
                          }
                        </Text>
                        {selectedAppointment.serviceStylistPairs && selectedAppointment.serviceStylistPairs.length > 1 && (
                          <Text style={styles.modalAppointmentServicesList}>
                            {selectedAppointment.serviceStylistPairs.map(pair => 
                              serviceNames[pair.serviceId] || pair.serviceId
                            ).join(', ')}
                          </Text>
                        )}
                        {selectedAppointment.serviceStylistPairs && selectedAppointment.serviceStylistPairs.length > 1 ? (
                          <View style={styles.modalStylistsContainer}>
                            <Text style={styles.modalStylistsTitle}>Services & Stylists:</Text>
                            {selectedAppointment.serviceStylistPairs.map((pair, index) => (
                              <Text key={index} style={styles.modalStylistItem}>
                                • {serviceNames[pair.serviceId] || pair.serviceId}: Stylist {pair.stylistId}
                              </Text>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.modalAppointmentStylist}>
                            with {selectedAppointment.stylist?.firstName || 'Stylist'} {selectedAppointment.stylist?.lastName || 'Name'}
                          </Text>
                        )}
                        <View style={styles.modalAppointmentInfo}>
                          <View style={styles.modalAppointmentInfoItem}>
                            <Ionicons name="time" size={16} color="#666" />
                            <Text style={styles.modalAppointmentInfoText}>
                              {AppointmentService.formatDate(selectedAppointment.appointmentDate)} at {AppointmentService.formatTime(selectedAppointment.appointmentTime)}
                            </Text>
                          </View>
                          <View style={styles.modalAppointmentInfoItem}>
                            <Ionicons name="location" size={16} color="#666" />
                            <Text style={styles.modalAppointmentInfoText}>
                              {branchNames[selectedAppointment.branchId || ''] || `Branch ${selectedAppointment.branchId || 'Unknown'}`}
                            </Text>
                          </View>
                          {selectedAppointment.notes && (
                            <View style={styles.modalAppointmentInfoItem}>
                              <Ionicons name="document-text" size={16} color="#666" />
                              <Text style={styles.modalAppointmentInfoText}>
                                {selectedAppointment.notes}
                              </Text>
                            </View>
                          )}
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
                    {selectedAppointment.status === 'scheduled' && !selectedAppointment.history?.some(h => h.action === 'rescheduled') && (
                      <TouchableOpacity style={styles.modalRescheduleButton} onPress={handleReschedule}>
                        <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.modalRescheduleButtonText}>Reschedule</Text>
                      </TouchableOpacity>
                    )}
                    {selectedAppointment.status === 'scheduled' && (
                      <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancel}>
                        <Ionicons name="close-circle-outline" size={20} color="#160B53" />
                        <Text style={styles.modalCancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Reschedule Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={rescheduleModalVisible}
          onRequestClose={() => setRescheduleModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rescheduleModalContent}>
              <View style={styles.rescheduleModalHeader}>
                <Text style={styles.rescheduleModalTitle}>Reschedule Appointment</Text>
                <TouchableOpacity 
                  onPress={() => setRescheduleModalVisible(false)} 
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.rescheduleForm}>
                <Text style={styles.rescheduleNote}>
                  📋 You will be placed in a queue and notified once your reschedule request is confirmed.
                </Text>
                
                {/* Date Selection */}
                <View style={styles.rescheduleField}>
                  <Text style={styles.rescheduleLabel}>New Date</Text>
                  <TouchableOpacity 
                    style={styles.rescheduleInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.rescheduleInputText}>
                      {selectedDate.toLocaleDateString()}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                {/* Time Selection */}
                <View style={styles.rescheduleField}>
                  <Text style={styles.rescheduleLabel}>New Time</Text>
                  <TouchableOpacity 
                    style={styles.rescheduleInput}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.rescheduleInputText}>
                      {selectedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                {/* Notes */}
                <View style={styles.rescheduleField}>
                  <Text style={styles.rescheduleLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={styles.rescheduleTextArea}
                    placeholder="Any additional notes for your reschedule request..."
                    value={rescheduleNotes}
                    onChangeText={setRescheduleNotes}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              
              <View style={styles.rescheduleActions}>
                <TouchableOpacity 
                  style={styles.rescheduleCancelButton}
                  onPress={() => setRescheduleModalVisible(false)}
                >
                  <Text style={styles.rescheduleCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rescheduleSubmitButton}
                  onPress={handleRescheduleSubmit}
                >
                  <Text style={styles.rescheduleSubmitButtonText}>Submit Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event: any, selectedDate?: Date) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setSelectedDate(selectedDate);
                }
              }}
            />
          )}
          
          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={(event: any, selectedTime?: Date) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setSelectedTime(selectedTime);
                }
              }}
            />
          )}
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
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : Platform.OS === 'android' ? 16 : 20,
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
    marginBottom: Platform.OS === 'web' ? 16 : 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
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
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 15 : Platform.OS === 'android' ? 14 : 16,
    color: '#160B53',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  modalAppointmentServicesList: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
  },
  modalAppointmentStylist: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  modalStylistsContainer: {
    marginBottom: 12,
  },
  modalStylistsTitle: {
    fontSize: 16,
    color: '#160B53',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalStylistItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
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
  // Status Filter styles
  statusFilterContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  statusFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#160B53',
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  statusFilterButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  statusFilterButtonText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins_500Medium',
  },
  statusFilterButtonTextActive: {
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
    fontSize: 14,
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
    fontSize: 16,
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
  // Enhanced Card Layout Styles
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
  },
  cardContent: {
    padding: 24,
    paddingTop: 20,
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
  appointmentInfo: {
    gap: 6,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins_600SemiBold',
    minWidth: 80,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 20,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
  },
  rescheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  rescheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
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
  // Reschedule Modal Styles
  rescheduleModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width * 0.95,
    maxWidth: 500,
    maxHeight: '90%',
  },
  rescheduleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rescheduleModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#160B53',
    fontFamily: 'Poppins_700Bold',
  },
  rescheduleForm: {
    marginBottom: 24,
  },
  rescheduleNote: {
    fontSize: 14,
    color: '#4A90E2',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  rescheduleField: {
    marginBottom: 20,
  },
  rescheduleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#160B53',
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  rescheduleInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rescheduleInputText: {
    fontSize: 16,
    color: '#160B53',
    fontFamily: 'Poppins_400Regular',
  },
  rescheduleTextArea: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#160B53',
    fontFamily: 'Poppins_400Regular',
    minHeight: 80,
  },
  rescheduleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rescheduleCancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rescheduleCancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Poppins_600SemiBold',
  },
  rescheduleSubmitButton: {
    flex: 1,
    backgroundColor: APP_CONFIG.primaryColor,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rescheduleSubmitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
});