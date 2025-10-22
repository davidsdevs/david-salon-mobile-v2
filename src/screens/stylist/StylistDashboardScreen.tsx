import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistButton,
  StylistCard,
  StylistBadge,
} from '../../components/stylist';
import useAuth from '../../hooks/useAuth';
import { APP_CONFIG, FONTS } from '../../constants';
import { Appointment } from '../../types';
import { Stylist, Branch } from '../../types/api';
import { db, COLLECTIONS } from '../../config/firebase';

const { width } = Dimensions.get('window');

export default function StylistDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [isLoadingBranch, setIsLoadingBranch] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    clientsServed: 0,
    newClients: 0,
    transferClients: 0,
    regularClients: 0,
  });

  // Fetch branch name based on stylist's branchId
  useEffect(() => {
    const fetchBranchName = async () => {
      if (user && user.userType === 'stylist') {
        const stylist = user as Stylist;
        if (stylist.branchId) {
          try {
            const branchDoc = await getDoc(doc(db, COLLECTIONS.BRANCHES, stylist.branchId));
            if (branchDoc.exists()) {
              const branchData = branchDoc.data() as Branch;
              setBranchName(branchData.name || '');
            }
          } catch (error) {
            console.error('Error fetching branch:', error);
          }
        }
      }
      setIsLoadingBranch(false);
    };

    fetchBranchName();
  }, [user]);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openAppointmentDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  const closeAppointmentDetails = () => {
    setIsModalVisible(false);
    setSelectedAppointment(null);
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
            // TODO: Update appointment status to confirmed
            closeAppointmentDetails();
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
            // TODO: Update appointment status to cancelled
            closeAppointmentDetails();
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Fetch today's appointments from Firebase
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📋 Fetching today\'s appointments for stylist:', user.id);

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
        const q = query(
          appointmentsRef,
          where('stylistId', '==', user.id),
          where('date', '>=', Timestamp.fromDate(today)),
          where('date', '<', Timestamp.fromDate(tomorrow))
        );

        const querySnapshot = await getDocs(q);
        const appointments: any[] = [];
        let newClients = 0;
        let transferClients = 0;
        let regularClients = 0;

        for (const appointmentDoc of querySnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          
          // Fetch client details
          const clientDoc = await getDoc(doc(db, COLLECTIONS.USERS, appointmentData['clientId']));
          const clientData = clientDoc.exists() ? clientDoc.data() : null;
          
          // Fetch service details
          const serviceDoc = await getDoc(doc(db, COLLECTIONS.SERVICES, appointmentData['serviceId']));
          const serviceData = serviceDoc.exists() ? serviceDoc.data() : null;

          const appointment = {
            id: appointmentDoc.id,
            client: clientData ? `${clientData['firstName']} ${clientData['lastName']}` : 'Unknown Client',
            service: serviceData ? serviceData['name'] : 'Unknown Service',
            time: appointmentData['startTime'] || 'N/A',
            duration: appointmentData['duration'] ? `${appointmentData['duration']} min` : 'N/A',
            clientType: 'R - Regular',
            notes: appointmentData['notes'] || '',
            price: appointmentData['price'] ? `₱${appointmentData['price']}` : '₱0',
            status: appointmentData['status'] || 'pending',
          };

          appointments.push(appointment);
          regularClients++;
        }

        setTodayAppointments(appointments);
        setStats({
          todayAppointments: appointments.length,
          clientsServed: appointments.filter(a => a.status === 'completed').length,
          newClients,
          transferClients,
          regularClients,
        });

        console.log('✅ Fetched appointments:', appointments.length);
      } catch (error) {
        console.error('❌ Error fetching appointments:', error);
        setTodayAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAppointments();
  }, [user?.id]);


  const rewards = [
    {
      id: 1,
      title: 'Free Hair Cut',
      description: 'Get a complimentary hair cut service',
      points: '1000 pts',
      buttonText: 'Redeem',
      buttonStyle: 'filled',
      available: true,
    },
    {
      id: 2,
      title: '20% Off Facial',
      description: 'Enjoy 20% discount on facial treatments',
      points: '500 pts',
      buttonText: 'Redeem',
      buttonStyle: 'filled',
      available: true,
    },
    {
      id: 3,
      title: 'Free Manicure',
      description: 'Complimentary manicure service',
      points: '300 pts',
      buttonText: 'Redeem',
      buttonStyle: 'filled',
      available: true,
    },
  ];

  // Platform-specific rendering
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    // WEB VIEW LAYOUT - DO NOT MODIFY THIS SECTION
    // This layout is specifically designed for web view and should remain unchanged
    return (
      <View style={styles.webContainer}>
          {/* Welcome Banner */}
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeTitle}>Welcome back, {user?.firstName || 'Maria'}!</Text>
            <Text style={styles.welcomeSubtitle}>
              {branchName && `${branchName} • `}Here's your dashboard for today {new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>


          {/* Summary Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Today Appointments</Text>
                <View style={styles.statIcon}>
                  <Ionicons name="calendar" size={24} color="#160B53" />
                </View>
              </View>
              <Text style={styles.statValue}>{loading ? '-' : stats.todayAppointments}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Clients Served</Text>
                <View style={styles.statIcon}>
                  <Ionicons name="people" size={24} color="#160B53" />
                </View>
              </View>
              <Text style={styles.statValue}>{loading ? '-' : stats.clientsServed}</Text>
            </View>
          </View>

          {/* Today's Client Breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Today's Client Breakdown</Text>
            <View style={styles.clientBreakdownGrid}>
              <View style={[styles.clientTypeCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 }]}>
                <View style={styles.clientTypeIcon}>
                  <Text style={styles.clientTypeIconText}>X</Text>
                </View>
                <Text style={styles.clientTypeNumber}>{loading ? '-' : stats.newClients}</Text>
                <Text style={styles.clientTypeLabel}>New Clients (X)</Text>
                <Text style={styles.clientTypeDescription}>First-time visitors</Text>
              </View>
              <View style={[styles.clientTypeCard, { backgroundColor: '#FCE7F3', borderColor: '#FBCFE8', borderWidth: 1 }]}>
                <View style={styles.clientTypeIcon}>
                  <Text style={styles.clientTypeIconText}>TR</Text>
                </View>
                <Text style={styles.clientTypeNumber}>{loading ? '-' : stats.transferClients}</Text>
                <Text style={styles.clientTypeLabel}>Transfer Clients (TR)</Text>
                <Text style={styles.clientTypeDescription}>No preferred stylist</Text>
              </View>
              <View style={[styles.clientTypeCard, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', borderWidth: 1 }]}>
                <View style={styles.clientTypeIcon}>
                  <Text style={styles.clientTypeIconText}>R</Text>
                </View>
                <Text style={styles.clientTypeNumber}>{loading ? '-' : stats.regularClients}</Text>
                <Text style={styles.clientTypeLabel}>Regular Clients (R)</Text>
                <Text style={styles.clientTypeDescription}>Preferred stylist clients</Text>
              </View>
      </View>
    </View>

          {/* Today's Appointments */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Appointments</Text>
              <StylistButton
                title="Book New Appointment"
                onPress={() => console.log('Book appointment')}
                variant="primary"
                icon="add-circle-outline"
              />
            </View>
            <View style={styles.appointmentsList}>
              {todayAppointments.map((appointment) => (
                <TouchableOpacity key={appointment.id} style={styles.appointmentCard} onPress={() => openAppointmentDetails(appointment)}>
      <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentTime}>{appointment.time}</Text>
                    <Text style={styles.appointmentClient}>{appointment.client}</Text>
                    <Text style={styles.appointmentClientType}>{appointment.clientType}</Text>
                  </View>
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.appointmentService}>{appointment.service}</Text>
                    <Text style={styles.appointmentDuration}>Duration: {appointment.duration}</Text>
                    <View style={styles.appointmentFooter}>
                      <Text style={styles.appointmentPrice}>{appointment.price}</Text>
                      <StylistBadge
                        label={appointment.status}
                        variant={appointment.status === 'confirmed' ? 'confirmed' : 'pending'}
                        size="small"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Appointment Details Modal (Web) */}
          <Modal visible={isModalVisible} animationType="fade" transparent onRequestClose={closeAppointmentDetails}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Appointment Details</Text>
                {selectedAppointment && (
                  <View style={styles.modalBody}>
                    <Text style={styles.modalRow}><Text style={styles.modalLabel}>Time:</Text> {selectedAppointment.time}</Text>
                    <Text style={styles.modalRow}><Text style={styles.modalLabel}>Client:</Text> {selectedAppointment.client}</Text>
                    <Text style={styles.modalRow}><Text style={styles.modalLabel}>Type:</Text> {selectedAppointment.clientType}</Text>
                    <Text style={styles.modalRow}><Text style={styles.modalLabel}>Service:</Text> {selectedAppointment.service}</Text>
                    <Text style={styles.modalRow}><Text style={styles.modalLabel}>Duration:</Text> {selectedAppointment.duration}</Text>
                    <Text style={styles.modalRow}><Text style={styles.modalLabel}>Notes:</Text> {selectedAppointment.notes}</Text>
                    <Text style={styles.modalRow}><Text style={styles.modalLabel}>Price:</Text> {selectedAppointment.price}</Text>
                    <Text style={styles.modalRow}><Text style={styles.modalLabel}>Status:</Text> {selectedAppointment.status}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.modalCloseButton} onPress={closeAppointmentDetails}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

      </View>
  );
  }

  // Mobile view
  return (
    <ScreenWrapper title="Dashboard" userType="stylist">
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.welcomeTitle}>Welcome back, {user?.firstName || 'Maria'}!</Text>
        <Text style={styles.welcomeSubtitle}>
          {branchName && `${branchName} • `}Here's your dashboard for today {new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>


      {/* Available Rewards - Web View Only */}
      {isWeb && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <View style={styles.rewardsContainer}>
            {rewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardPoints}>{reward.points}</Text>
                  <Text style={styles.rewardDescription}>{reward.description}</Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.rewardButton,
                    reward.buttonStyle === 'filled' && styles.rewardButtonFilled,
                    reward.buttonStyle === 'disabled' && styles.rewardButtonDisabled
                  ]}
                  disabled={!reward.available}
                >
                  <Text style={[
                    styles.rewardButtonText,
                    reward.buttonStyle === 'filled' && styles.rewardButtonTextFilled,
                    reward.buttonStyle === 'disabled' && styles.rewardButtonTextDisabled
                  ]}>
                    {reward.buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="calendar" size={24} color="#160B53" />
            </View>
            <Text style={styles.metricNumber}>8</Text>
            <Text style={styles.metricLabel}>Today Appointments</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="people" size={24} color="#160B53" />
            </View>
            <Text style={styles.metricNumber}>6</Text>
            <Text style={styles.metricLabel}>Clients Served</Text>
          </View>
        </View>
      </View>

      {/* Today's Client Breakdown */}
      <StylistSection>
        <View style={styles.breakdownHeader}>
          <Ionicons name="people-outline" size={20} color="#160B53" />
          <Text style={styles.breakdownTitle}>Today's Client Breakdown</Text>
        </View>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownCardYellow}>
            <View style={styles.breakdownContent}>
              <Text style={styles.breakdownLabel}>New Clients (X)</Text>
              <Text style={styles.breakdownNumber}>1</Text>
              <Text style={styles.breakdownSubtext}>First-time visitors</Text>
            </View>
            <View style={styles.breakdownIconCircle}>
              <Text style={styles.breakdownIconText}>X</Text>
            </View>
          </View>
          <View style={styles.breakdownCardPink}>
            <View style={styles.breakdownContent}>
              <Text style={styles.breakdownLabel}>Transfer Clients (TR)</Text>
              <Text style={styles.breakdownNumber}>1</Text>
              <Text style={styles.breakdownSubtext}>No preferred stylist</Text>
            </View>
            <View style={styles.breakdownIconCircle}>
              <Text style={styles.breakdownIconText}>TR</Text>
            </View>
          </View>
          <View style={styles.breakdownCardCyan}>
            <View style={styles.breakdownContent}>
              <Text style={styles.breakdownLabel}>Regular Clients (R)</Text>
              <Text style={styles.breakdownNumber}>1</Text>
              <Text style={styles.breakdownSubtext}>Preferred stylist clients</Text>
            </View>
            <View style={styles.breakdownIconCircle}>
              <Text style={styles.breakdownIconText}>R</Text>
            </View>
          </View>
        </View>
      </StylistSection>

      {/* Today's Appointments */}
      <StylistSection>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        {todayAppointments.map((appointment) => (
          <TouchableOpacity 
            key={appointment.id}
            style={styles.appointmentCard}
            onPress={() => openAppointmentDetails(appointment)}
          >
            <View style={styles.appointmentLeft}>
              <View style={styles.appointmentIcon}>
                <Ionicons name="calendar" size={20} color="#4A90E2" />
              </View>
              <View style={styles.appointmentDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.appointmentClient}>{appointment.client}</Text>
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
                <Text style={styles.appointmentService}>{appointment.service}</Text>
                <View style={styles.appointmentInfo}>
                  <View style={styles.appointmentInfoItem}>
                    <Ionicons name="time" size={14} color="#666" />
                    <Text style={styles.appointmentInfoText}>
                      {appointment.time} • {appointment.duration}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.appointmentRight}>
              <Text style={styles.priceText}>{appointment.price}</Text>
              <StylistBadge
                label={appointment.status}
                variant={appointment.status === 'confirmed' ? 'confirmed' : 'pending'}
                size="small"
              />
            </View>
          </TouchableOpacity>
        ))}
      </StylistSection>


      {/* Appointment Details Modal (Mobile) */}
      <Modal visible={isModalVisible} animationType="fade" transparent onRequestClose={closeAppointmentDetails}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={closeAppointmentDetails}>
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
                    <Ionicons name="cash-outline" size={20} color="#666" />
                    <View style={styles.modalDetailContent}>
                      <Text style={styles.modalDetailLabel}>Price</Text>
                      <Text style={styles.modalDetailValue}>{selectedAppointment.price}</Text>
                    </View>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Ionicons name="document-text-outline" size={20} color="#666" />
                    <View style={styles.modalDetailContent}>
                      <Text style={styles.modalDetailLabel}>Notes</Text>
                      <Text style={styles.modalDetailValue}>{selectedAppointment.notes}</Text>
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

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: '100%',
  },
  welcomeBanner: {
    backgroundColor: APP_CONFIG.primaryColor,
    marginHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginTop: Platform.OS === 'web' ? 8 : Platform.OS === 'android' ? 30 : 20,
    marginBottom: 16,
    padding: Platform.OS === 'web' ? 16 : 20,
    paddingTop: Platform.OS === 'web' ? 24 : 20,
    borderRadius: 12,
    height: Platform.OS === 'web' ? 118 : undefined,
  },
  welcomeTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 20 : 18,
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? FONTS.semiBold : FONTS.bold,
  },
  welcomeSubtitle: {
    fontSize: Platform.OS === 'ios' ? 14 : Platform.OS === 'android' ? 13 : 15,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: FONTS.regular,
  },
  metricsContainer: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 14 : 16,
    alignItems: 'center',
    width: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    minHeight: Platform.OS === 'android' ? 90 : Platform.OS === 'ios' ? 95 : 100,
  },
  metricIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  metricNumber: {
    fontSize: Platform.OS === 'android' ? 24 : Platform.OS === 'ios' ? 26 : 28,
    color: '#160B53',
    marginTop: 24,
    marginBottom: 6,
    fontFamily: 'Poppins_700Bold',
  },
  metricLabel: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    color: '#160B53',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  section: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: 20,
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
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: Platform.OS === 'web' ? '#E5E7EB' : 'transparent',
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 15 : Platform.OS === 'android' ? 14 : 16,
    color: Platform.OS === 'web' ? '#000000' : '#160B53',
    marginBottom: Platform.OS === 'web' ? 16 : 12,
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : 'Poppins_600SemiBold',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 14 : 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.05,
    shadowRadius: Platform.OS === 'web' ? 15 : 4,
    elevation: Platform.OS === 'web' ? 0 : 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appointmentDetails: {
    flex: 1,
    fontSize: Platform.OS === 'web' ? 14 : 14,
    color: Platform.OS === 'web' ? '#6B7280' : '#666',
    marginBottom: Platform.OS === 'web' ? 2 : 4,
    fontFamily: Platform.OS === 'web' ? FONTS.regular : 'Poppins_400Regular',
  },
  appointmentService: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 15 : Platform.OS === 'android' ? 14 : 16,
    color: Platform.OS === 'web' ? '#160B53' : '#160B53',
    marginBottom: Platform.OS === 'web' ? 4 : 4,
    fontFamily: Platform.OS === 'web' ? FONTS.semiBold : 'Poppins_700Bold',
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
    marginLeft: 5,
    fontFamily: 'Poppins_400Regular',
  },
  statusBadge: {
    paddingHorizontal: Platform.OS === 'web' ? 12 : 12,
    paddingVertical: Platform.OS === 'web' ? 6 : 6,
    borderRadius: Platform.OS === 'web' ? 12 : 15,
    alignSelf: Platform.OS === 'web' ? 'flex-start' : 'auto',
  },
  statusText: {
    fontSize: Platform.OS === 'web' ? 12 : Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    color: Platform.OS === 'web' ? '#FFFFFF' : '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? FONTS.medium : 'Poppins_400Regular',
    textTransform: Platform.OS === 'web' ? 'capitalize' : 'none',
  },
  rewardsContainer: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rewardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rewardLeft: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    color: '#160B53',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  rewardPoints: {
    fontSize: 14,
    color: '#160B53',
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  rewardButton: {
    borderWidth: 1,
    borderColor: '#160B53',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rewardButtonFilled: {
    backgroundColor: '#160B53',
    borderColor: '#160B53',
  },
  rewardButtonDisabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  rewardButtonText: {
    color: '#160B53',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  rewardButtonTextFilled: {
    color: '#FFFFFF',
  },
  rewardButtonTextDisabled: {
    color: '#999',
  },
  // ========================================
  // WEB-SPECIFIC STYLES - DO NOT MODIFY
  // These styles are ONLY for web view and should remain unchanged
  // ========================================
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    height: Platform.OS === 'web' ? 131 : undefined,
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.05,
    shadowRadius: Platform.OS === 'web' ? 15 : 4,
    elevation: Platform.OS === 'web' ? 0 : 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 16 : 8,
  },
  statText: {
    flex: 1,
  },
  statLabel: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: Platform.OS === 'web' ? '#000000' : '#6B7280',
    fontFamily: Platform.OS === 'web' ? FONTS.medium : FONTS.regular,
  },
  statValue: {
    fontSize: Platform.OS === 'web' ? 32 : 20,
    color: Platform.OS === 'web' ? '#000000' : '#111827',
    fontFamily: Platform.OS === 'web' ? FONTS.bold : FONTS.bold,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentsList: {
    gap: 8,
  },
  bookButton: {
    backgroundColor: '#160B53',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  appointmentContent: {
    flex: 1,
    marginRight: 16,
  },
  statusConfirmed: {
    backgroundColor: '#10B981',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  // New styles for client breakdown
  clientBreakdownGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  clientTypeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clientTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  clientTypeIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  clientTypeNumber: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#000000',
    marginBottom: 4,
  },
  clientTypeLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  clientTypeDescription: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: '#666666',
    textAlign: 'center',
  },
  // Updated appointment styles
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  appointmentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentTime: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  appointmentClient: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#000000',
  },
  appointmentClientType: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#374151',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appointmentDuration: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#666666',
    marginBottom: 4,
  },
  appointmentNotes: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#666666',
    marginBottom: 8,
  },
  // Modal styles
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
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 12,
  },
  modalBody: {
    marginBottom: 16,
    gap: 6,
  },
  modalRow: {
    fontSize: 14,
    color: '#111827',
    fontFamily: FONTS.regular,
  },
  modalLabel: {
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#160B53',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentPrice: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#000000',
  },
  // Appointment list styles matching Appointments page
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  appointmentRight: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  // Client Breakdown Styles
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  breakdownGrid: {
    gap: 12,
  },
  breakdownCardYellow: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  breakdownCardPink: {
    backgroundColor: '#FCE7F3',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  breakdownCardCyan: {
    backgroundColor: '#CCFBF1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#374151',
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  breakdownNumber: {
    fontSize: 28,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  breakdownSubtext: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  breakdownIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownIconText: {
    fontSize: 16,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  // Enhanced Modal Styles
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  // ========================================
  // END OF WEB-SPECIFIC STYLES
  // ========================================
});
