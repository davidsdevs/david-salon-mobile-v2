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
import { doc, getDoc, collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistButton,
  StylistCard,
  StylistBadge,
  ClientTypeLegend,
} from '../../components/stylist';
import { useAuth } from '../../hooks/redux';
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
    todayEarnings: 0,
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
  // Helper function to determine client type
  const getClientType = (appointment: any): 'X' | 'TR' | 'R' => {
    // Check if appointment has clientType field
    if (appointment.clientType) {
      if (appointment.clientType === 'new' || appointment.clientType === 'X - New Client' || appointment.clientType.includes('X')) return 'X';
      if (appointment.clientType === 'transfer' || appointment.clientType === 'TR - Transfer' || appointment.clientType.includes('TR')) return 'TR';
      if (appointment.clientType === 'regular' || appointment.clientType === 'R - Regular' || appointment.clientType.includes('R')) return 'R';
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

  // Fetch today's appointments from Firebase with real-time updates
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('📋 Setting up real-time listener for stylist:', user.id);

    // Get today's date in local timezone as string (YYYY-MM-DD)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    console.log('📅 Looking for appointmentDate:', todayString, 'Current local date:', today.toLocaleDateString());

    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(appointmentsRef, async (querySnapshot) => {
      try {
        console.log('🔄 Real-time update received - Total appointments:', querySnapshot.size);
        
        const appointments: any[] = [];
        let newClients = 0;
        let transferClients = 0;
        let regularClients = 0;

        for (const appointmentDoc of querySnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          
          // Check if appointment is for today
          const appointmentDateString = appointmentData['appointmentDate'];
          if (appointmentDateString !== todayString) {
            continue; // Skip if not today
          }
          
          console.log('🔍 Checking appointment:', appointmentDoc.id, {
            stylistId: appointmentData['stylistId'],
            serviceStylistPairs: appointmentData['serviceStylistPairs'],
            currentUserId: user.id,
            appointmentDate: appointmentDateString
          });
          
          // Check if this appointment belongs to the current stylist
          let isStylistAppointment = false;
          
          // Check direct stylistId field
          if (appointmentData['stylistId'] === user.id) {
            console.log('✅ Match found via stylistId');
            isStylistAppointment = true;
          }
          
          // Check serviceStylistPairs array
          if (appointmentData['serviceStylistPairs'] && Array.isArray(appointmentData['serviceStylistPairs'])) {
            const hasStylist = appointmentData['serviceStylistPairs'].some(
              (pair: any) => pair.stylistId === user.id
            );
            if (hasStylist) {
              console.log('✅ Match found via serviceStylistPairs');
              isStylistAppointment = true;
            }
          }
          
          // Skip if not this stylist's appointment
          if (!isStylistAppointment) {
            console.log('❌ Skipping - not this stylist\'s appointment');
            continue;
          }
          
          console.log('✅ Including appointment:', appointmentDoc.id);
          
          // Fetch client details
          let clientData = null;
          if (appointmentData['clientId']) {
            try {
              const clientDoc = await getDoc(doc(db, COLLECTIONS.USERS, appointmentData['clientId']));
              clientData = clientDoc.exists() ? clientDoc.data() : null;
            } catch (error) {
              console.log('⚠️ Error fetching client:', error);
            }
          }
          
          // Fetch service details - get from serviceStylistPairs if available
          let serviceData = null;
          let serviceId = appointmentData['serviceId'];
          
          // If no direct serviceId, get from serviceStylistPairs
          if (!serviceId && appointmentData['serviceStylistPairs'] && appointmentData['serviceStylistPairs'].length > 0) {
            serviceId = appointmentData['serviceStylistPairs'][0].serviceId;
          }
          
          if (serviceId) {
            try {
              const serviceDoc = await getDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
              serviceData = serviceDoc.exists() ? serviceDoc.data() : null;
            } catch (error) {
              console.log('⚠️ Error fetching service:', error);
            }
          }

          // Calculate price from serviceStylistPairs or totalPrice
          let price = 0;
          if (appointmentData['serviceStylistPairs'] && Array.isArray(appointmentData['serviceStylistPairs'])) {
            price = appointmentData['serviceStylistPairs'].reduce((sum: number, pair: any) => sum + (pair.servicePrice || 0), 0);
          } else if (appointmentData['totalPrice']) {
            price = appointmentData['totalPrice'];
          } else if (appointmentData['price']) {
            price = appointmentData['price'];
          }

          // Get service name from serviceStylistPairs or fetched service data
          let serviceName = 'Unknown Service';
          let serviceCount = 0;
          if (appointmentData['serviceStylistPairs'] && appointmentData['serviceStylistPairs'].length > 0) {
            serviceCount = appointmentData['serviceStylistPairs'].length;
            if (serviceCount === 1) {
              serviceName = appointmentData['serviceStylistPairs'][0].serviceName || 'Unknown Service';
            } else {
              serviceName = `${serviceCount} Services`;
            }
          } else if (serviceData && serviceData['name']) {
            serviceName = serviceData['name'];
            serviceCount = 1;
          }

          const appointment = {
            id: appointmentDoc.id,
            client: clientData ? `${clientData['firstName'] || ''} ${clientData['lastName'] || ''}`.trim() : 'Unknown Client',
            service: serviceName,
            serviceCount: serviceCount,
            serviceStylistPairs: appointmentData['serviceStylistPairs'] || [],
            time: appointmentData['appointmentTime'] || appointmentData['startTime'] || 'N/A',
            duration: appointmentData['duration'] ? `${appointmentData['duration']} min` : 'N/A',
            clientType: 'R - Regular',
            notes: appointmentData['notes'] || '',
            price: `₱${price}`,
            status: appointmentData['status'] || 'scheduled',
          };

          appointments.push(appointment);
          regularClients++;
        }

        // Count today's completed appointments
        const todayClientsServed = appointments.filter(a => a.status === 'completed').length;

        // Calculate today's earnings from completed appointments
        const todayEarnings = appointments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => {
            // Extract numeric value from price string (e.g., "₱500" -> 500)
            const priceValue = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
            return sum + priceValue;
          }, 0);

        // Sort appointments: cancelled appointments at the bottom
        const sortedAppointments = appointments.sort((a, b) => {
          // If one is cancelled and the other isn't, cancelled goes to bottom
          if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
          if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
          // Otherwise maintain original order
          return 0;
        });

        setTodayAppointments(sortedAppointments);
        setStats({
          todayAppointments: appointments.length,
          clientsServed: todayClientsServed, // Today's completed appointments
          newClients,
          transferClients,
          regularClients,
          todayEarnings,
        });

        console.log('✅ Real-time update processed:', appointments.length, 'Clients served today:', todayClientsServed);
      } catch (error) {
        console.error('❌ Error processing real-time update:', error);
        setTodayAppointments([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time listener error:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔌 Unsubscribing from appointments listener');
      unsubscribe();
    };
  }, [user?.id]);


  // Removed unused rewards array

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
                <Text style={styles.statLabel}>Today's Appointments</Text>
                <View style={styles.statIcon}>
                  <Ionicons name="calendar" size={24} color="#160B53" />
                </View>
              </View>
              <Text style={styles.statValue}>{loading ? '-' : stats.todayAppointments}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Clients Served Today</Text>
                <View style={styles.statIcon}>
                  <Ionicons name="people" size={24} color="#160B53" />
                </View>
              </View>
              <Text style={styles.statValue}>{loading ? '-' : stats.clientsServed}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Today's Earnings</Text>
                <View style={styles.statIcon}>
                  <Ionicons name="cash" size={24} color="#160B53" />
                </View>
              </View>
              <Text style={styles.statValue}>{loading ? '-' : `₱${stats.todayEarnings.toFixed(2)}`}</Text>
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
              {loading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color="#160B53" />
                  <Text style={styles.emptyStateText}>Loading appointments...</Text>
                </View>
              ) : todayAppointments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>No Appointments Today</Text>
                  <Text style={styles.emptyStateText}>You have no appointments scheduled for today.</Text>
                </View>
              ) : (
                todayAppointments.map((appointment) => (
                  <TouchableOpacity key={appointment.id} style={styles.appointmentCard} onPress={() => openAppointmentDetails(appointment)}>
        <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentTime}>{appointment.time}</Text>
                      <Text style={styles.appointmentClient}>{appointment.client}</Text>
                      <Text style={styles.appointmentClientType}>{appointment.clientType}</Text>
                    </View>
                    <View style={styles.appointmentDetails}>
                      <Text style={styles.appointmentService}>{appointment.service}</Text>
                      <View style={styles.appointmentFooter}>
                        <Text style={styles.appointmentPrice}>{appointment.price}</Text>
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
                    </View>
                  </TouchableOpacity>
                ))
              )}
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
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Welcome Banner */}
        <StylistSection>
          <View style={styles.welcomeBanner}>
            <View>
              <Text style={styles.welcomeTitle}>Welcome back, {user?.firstName || 'Stylist'}! 👋</Text>
              <Text style={styles.welcomeSubtitle}>
                {branchName && `${branchName} • `}{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>
        </StylistSection>

        {/* Key Metrics - Enhanced Stats Card with Client Breakdown */}
        <StylistSection>
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Today's Overview</Text>
            </View>
            
            {/* Main Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar" size={20} color="#160B53" />
                </View>
                <Text style={styles.statNumber}>{loading ? '-' : stats.todayAppointments}</Text>
                <Text style={styles.statLabel}>Appointments</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="people" size={20} color="#1E40AF" />
                </View>
                <Text style={[styles.statNumber, { color: '#1E40AF' }]}>{loading ? '-' : stats.clientsServed}</Text>
                <Text style={styles.statLabel}>Served</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="cash" size={20} color="#10B981" />
                </View>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>{loading ? '-' : `₱${stats.todayEarnings.toFixed(2)}`}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.statsDivider} />

            {/* Client Breakdown - Compact */}
            <View style={styles.clientBreakdownCompact}>
              <View style={styles.breakdownHeaderRow}>
                <Text style={styles.breakdownCompactTitle}>Client Types</Text>
                <ClientTypeLegend variant="icon" />
              </View>
              <View style={styles.clientTypesRow}>
                <View style={styles.clientTypeCompact}>
                  <View style={[styles.clientTypeBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.clientTypeBadgeText, { color: '#F59E0B' }]}>X</Text>
                  </View>
                  <Text style={styles.clientTypeCount}>{loading ? '-' : stats.newClients}</Text>
                  <Text style={styles.clientTypeLabel}>New</Text>
                </View>
                <View style={styles.clientTypeCompact}>
                  <View style={[styles.clientTypeBadge, { backgroundColor: '#FCE7F3' }]}>
                    <Text style={[styles.clientTypeBadgeText, { color: '#EC4899' }]}>R</Text>
                  </View>
                  <Text style={styles.clientTypeCount}>{loading ? '-' : stats.regularClients}</Text>
                  <Text style={styles.clientTypeLabel}>Regular</Text>
                </View>
                <View style={styles.clientTypeCompact}>
                  <View style={[styles.clientTypeBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.clientTypeBadgeText, { color: '#10B981' }]}>TR</Text>
                  </View>
                  <Text style={styles.clientTypeCount}>{loading ? '-' : stats.transferClients}</Text>
                  <Text style={styles.clientTypeLabel}>Transfer</Text>
                </View>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Today's Appointments */}
        <StylistSection>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Today's Appointments</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{loading ? '0' : todayAppointments.length}</Text>
            </View>
          </View>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#160B53" />
            <Text style={styles.emptyStateText}>Loading appointments...</Text>
          </View>
        ) : todayAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIconContainer}>
              <Ionicons name="calendar-clear" size={48} color="#10B981" />
            </View>
            <Text style={styles.emptyStateTitle}>No Appointments Today</Text>
            <Text style={styles.emptyStateText}>
              Enjoy your free day! You have no appointments scheduled for today.
            </Text>
            <View style={styles.emptyStateHint}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.emptyStateHintText}>
                The receptionist will assign new appointments to you
              </Text>
            </View>
          </View>
        ) : (
          todayAppointments.map((appointment, index) => {
            return (
              <TouchableOpacity 
                key={appointment.id}
                style={styles.appointmentCard}
                onPress={() => openAppointmentDetails(appointment)}
              >
                <View style={styles.appointmentLeft}>
                  <View style={styles.appointmentIcon}>
                    <Ionicons 
                      name="calendar" 
                      size={20} 
                      color="#4A90E2" 
                    />
                  </View>
                  <View style={styles.appointmentDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.appointmentClient}>
                        {appointment.client || 
                         `${(appointment as any).clientFirstName || ''} ${(appointment as any).clientLastName || ''}`.trim() ||
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
                      <Text style={styles.appointmentStylist}>{appointment.service}</Text>
                    )}
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>
                          {appointment.time || (appointment as any).appointmentTime || (appointment as any).startTime || 'N/A'}
                        </Text>
                      </View>
                      {(appointment as any).branchName && (
                        <View style={styles.appointmentInfoItem}>
                          <Ionicons name="location" size={14} color="#666" />
                          <Text style={styles.appointmentInfoText}>
                            {(appointment as any).branchName}
                          </Text>
                        </View>
                      )}
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
                      const priceValue = typeof appointment.price === 'string' 
                        ? parseFloat(appointment.price.replace(/[^0-9.]/g, '')) || 0
                        : appointment.price || 0;
                      return priceValue.toFixed(2);
                    })()}
                  </Text>
                  <StylistBadge
                    label={
                      appointment.status === 'confirmed' ? 'Confirmed' :
                      appointment.status === 'scheduled' ? 'Scheduled' :
                      appointment.status === 'in_service' ? 'In Service' :
                      appointment.status === 'completed' ? 'Completed' :
                      appointment.status === 'cancelled' ? 'Cancelled' :
                      appointment.status === 'pending' ? 'Pending' : appointment.status
                    }
                    variant={
                      appointment.status === 'confirmed' ? 'confirmed' :
                      appointment.status === 'scheduled' ? 'scheduled' :
                      appointment.status === 'in_service' ? 'in-service' :
                      appointment.status === 'completed' ? 'completed' :
                      appointment.status === 'cancelled' ? 'cancelled' :
                      appointment.status === 'pending' ? 'pending' : 'default'
                    }
                    size="small"
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        </StylistSection>
      </ScrollView>

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
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>

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
                      <Text style={styles.modalDetailLabel}>Time</Text>
                      <Text style={styles.modalDetailValue}>{selectedAppointment.time}</Text>
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
                      <Text style={styles.modalDetailValue}>{selectedAppointment.notes || 'No notes'}</Text>
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
  welcomeBanner: {
    backgroundColor: APP_CONFIG.primaryColor,
    padding: Platform.OS === 'web' ? 16 : 20,
    paddingTop: Platform.OS === 'web' ? 24 : 20,
    borderRadius: 12,
    height: Platform.OS === 'web' ? 118 : undefined,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dateChipText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  // Enhanced Stats Card (same as Appointments page)
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#EF4444',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Stats Divider
  statsDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  // Compact Client Breakdown (inside stats card)
  clientBreakdownCompact: {
    marginTop: 4,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownCompactTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#6B7280',
  },
  clientTypesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clientTypeCompact: {
    alignItems: 'center',
    flex: 1,
  },
  clientTypeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  clientTypeBadgeText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  clientTypeCount: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 2,
  },
  // List Header (same as Appointments page)
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  countBadge: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 14 : 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
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
  nextAppointmentCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  nextUpBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nextUpText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  nextAppointmentIcon: {
    backgroundColor: '#D1FAE5',
  },
  nextAppointmentText: {
    color: '#10B981',
    fontFamily: FONTS.bold,
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
  // Removed duplicate statLabel - using the one from enhanced stats card
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
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  clientTypeCard: {
    width: '48%', // 2 columns with gap (approximately 50% - gap)
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
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    fontFamily: Platform.OS === 'web' ? FONTS.medium : 'Poppins_600SemiBold',
    color: '#160B53',
    marginBottom: 4,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: Platform.OS === 'android' ? 18 : Platform.OS === 'ios' ? 19 : 20,
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : 'Poppins_700Bold',
    color: '#160B53',
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
    fontFamily: 'Poppins_700Bold',
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyStateHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateHintText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONTS.medium,
  },
  // Earnings card styles
  earningsCard: {
    marginHorizontal: 0,
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  earningsNumber: {
    color: '#10B981',
  },
});  // ========================================
  // END OF WEB-SPECIFIC STYLES
  // ========================================
