import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { useAuth } from '../../hooks/redux';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistFilterTab,
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';

interface ScheduleAppointment {
  id: string;
  date: string;
  time: string;
  clientName: string;
  serviceName: string;
  branchId: string;
  branchName: string;
  status: string;
}

export default function StylistScheduleScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);
  const [branches, setBranches] = useState<{ [key: string]: string }>({});
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Fetch appointments with real-time updates
  useEffect(() => {
    if (!user?.uid && !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const stylistId = user.uid || user.id;
    console.log('🔄 Setting up real-time subscription for stylist schedule:', stylistId);

    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(appointmentsRef);

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        console.log('📡 Real-time schedule update received:', querySnapshot.size, 'appointments');
        const fetchedAppointments: ScheduleAppointment[] = [];
        const branchIds = new Set<string>();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Check if appointment belongs to this stylist
          const hasStylist = data['stylistId'] === stylistId || 
                            data['assignedStylistId'] === stylistId ||
                            (data['serviceStylistPairs'] && 
                             data['serviceStylistPairs'].some((p: any) => p.stylistId === stylistId));

          if (hasStylist) {
            const appointmentDate = data['appointmentDate'] || data['date'] || '';
            const appointmentTime = data['appointmentTime'] || data['startTime'] || '';
            const branchId = data['branchId'] || '';
            
            if (branchId) {
              branchIds.add(branchId);
            }

            // Get service name
            let serviceName = 'Unknown Service';
            if (data['serviceStylistPairs'] && data['serviceStylistPairs'].length > 0) {
              serviceName = data['serviceStylistPairs'].length === 1
                ? data['serviceStylistPairs'][0].serviceName
                : `${data['serviceStylistPairs'].length} Services`;
            }

            fetchedAppointments.push({
              id: doc.id,
              date: appointmentDate,
              time: appointmentTime,
              clientName: data['clientName'] || 
                         `${data['clientFirstName'] || ''} ${data['clientLastName'] || ''}`.trim() ||
                         'Unknown Client',
              serviceName,
              branchId,
              branchName: '', // Will be filled later
              status: data['status'] || 'pending',
            });
          }
        });

        // Fetch branch names
        const branchMap: { [key: string]: string } = {};
        for (const branchId of branchIds) {
          try {
            const branchDocRef = doc(db, COLLECTIONS.BRANCHES, branchId);
            const branchDoc = await getDoc(branchDocRef);
            if (branchDoc.exists()) {
              branchMap[branchId] = branchDoc.data()?.['name'] || 'Unknown Branch';
            }
          } catch (error) {
            console.error('Error fetching branch:', error);
            branchMap[branchId] = 'Unknown Branch';
          }
        }

        // Update appointments with branch names
        const appointmentsWithBranches = fetchedAppointments.map(apt => ({
          ...apt,
          branchName: branchMap[apt.branchId] || 'Unknown Branch',
        }));

        // Sort by date and time
        appointmentsWithBranches.sort((a, b) => {
          const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        });

        console.log('✅ Real-time schedule updated:', appointmentsWithBranches.length);
        setAppointments(appointmentsWithBranches);
        setBranches(branchMap);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error processing schedule update:', error);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time schedule listener error:', error);
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up schedule subscription');
      unsubscribe();
    };
  }, [user?.uid, user?.id]);

  // Filter appointments based on view and branch
  const getFilteredAppointments = () => {
    let filtered = appointments;

    // Filter by branch
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(apt => apt.branchId === selectedBranch);
    }

    // Filter by date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedView === 'daily') {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      });
    } else if (selectedView === 'weekly') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
    } else if (selectedView === 'monthly') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });
    }

    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((groups, apt) => {
    const date = apt.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(apt);
    return groups;
  }, {} as { [key: string]: ScheduleAppointment[] });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(date);
    aptDate.setHours(0, 0, 0, 0);

    if (aptDate.getTime() === today.getTime()) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (aptDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const branchOptions = [
    { label: 'All Branches', value: 'all' },
    ...Object.entries(branches).map(([id, name]) => ({
      label: name,
      value: id,
    })),
  ];

  return (
    <ScreenWrapper title="My Schedule" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <StylistSection>
          <StylistPageTitle title="My Schedule" />
          <Text style={styles.subtitle}>View your appointments across all branches</Text>
        </StylistSection>

        {/* View Filter */}
        <StylistSection>
          <View style={styles.filterRow}>
            <StylistFilterTab
              label="Daily"
              isActive={selectedView === 'daily'}
              onPress={() => setSelectedView('daily')}
            />
            <StylistFilterTab
              label="Weekly"
              isActive={selectedView === 'weekly'}
              onPress={() => setSelectedView('weekly')}
            />
            <StylistFilterTab
              label="Monthly"
              isActive={selectedView === 'monthly'}
              onPress={() => setSelectedView('monthly')}
            />
          </View>
        </StylistSection>

        {/* Branch Filter */}
        <StylistSection>
          <Text style={styles.filterLabel}>Filter by Branch</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.branchFilterScroll}
          >
            {branchOptions.map((branch) => (
              <TouchableOpacity
                key={branch.value}
                style={[
                  styles.branchChip,
                  selectedBranch === branch.value && styles.branchChipActive
                ]}
                onPress={() => setSelectedBranch(branch.value)}
              >
                <Text style={[
                  styles.branchChipText,
                  selectedBranch === branch.value && styles.branchChipTextActive
                ]}>
                  {branch.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </StylistSection>

        {/* Schedule List */}
        <StylistSection>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.emptyStateText}>Loading schedule...</Text>
            </View>
          ) : filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Appointments</Text>
              <Text style={styles.emptyStateText}>
                You have no appointments for this {selectedView} view.
              </Text>
            </View>
          ) : (
            Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{formatDate(date)}</Text>
                {dateAppointments.map((appointment) => (
                  <View key={appointment.id} style={styles.appointmentCard}>
                    <View style={styles.timeColumn}>
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text style={styles.timeText}>{appointment.time}</Text>
                    </View>
                    <View style={styles.appointmentDetails}>
                      <Text style={styles.clientName}>{appointment.clientName}</Text>
                      <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                      <View style={styles.branchTag}>
                        <Ionicons name="location" size={12} color="#160B53" />
                        <Text style={styles.branchTagText}>{appointment.branchName}</Text>
                      </View>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      appointment.status === 'confirmed' && styles.statusConfirmed,
                      appointment.status === 'pending' && styles.statusPending,
                      appointment.status === 'cancelled' && styles.statusCancelled,
                    ]}>
                      <Text style={styles.statusText}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
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
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#374151',
    marginBottom: 8,
  },
  branchFilterScroll: {
    flexDirection: 'row',
  },
  branchChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  branchChipActive: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  branchChipText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  branchChipTextActive: {
    color: '#FFFFFF',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeColumn: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginTop: 4,
  },
  appointmentDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#111827',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    marginBottom: 6,
  },
  branchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  branchTagText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#160B53',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusConfirmed: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
});
