import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
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
  StylistSearchBar,
  StylistFilterTab,
  StylistBadge,
  StylistPagination,
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';

const { width } = Dimensions.get('window');

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
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [sortBy, setSortBy] = useState<'time-asc' | 'time-desc' | 'client-asc' | 'client-desc' | 'status'>('time-asc');
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset to page 1 when date, branch, search, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, selectedBranch, searchQuery, sortBy]);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Generate calendar dates for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate dates to show (including previous month's trailing days)
    const dates: Date[] = [];
    
    // Add trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      dates.push(date);
    }
    
    // Add all days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(year, month, day));
    }
    
    // Add leading days from next month to complete the grid
    const remainingDays = 7 - (dates.length % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        dates.push(new Date(year, month + 1, day));
      }
    }
    
    setCalendarDates(dates);
  }, [currentDate]);

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

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      if (selectedBranch !== 'all' && apt.branchId !== selectedBranch) {
        return false;
      }
      return apt.date === dateString;
    });
  };

  // Filter and sort appointments
  const filteredAppointments = appointments.filter(apt => {
    // Filter by branch
    if (selectedBranch !== 'all' && apt.branchId !== selectedBranch) {
      return false;
    }
    
    // Filter by selected date
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      if (apt.date !== dateString) {
        return false;
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return apt.clientName.toLowerCase().includes(query) ||
             apt.serviceName.toLowerCase().includes(query) ||
             apt.branchName.toLowerCase().includes(query);
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'time-asc':
        return a.time.localeCompare(b.time);
      case 'time-desc':
        return b.time.localeCompare(a.time);
      case 'client-asc':
        return a.clientName.localeCompare(b.clientName);
      case 'client-desc':
        return b.clientName.localeCompare(a.clientName);
      case 'status':
        const statusOrder: Record<string, number> = {
          'confirmed': 1,
          'scheduled': 2,
          'in_service': 3,
          'completed': 4,
          'cancelled': 5,
        };
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      default:
        return 0;
    }
  });

  // Get appointments for display (either filtered by date or all filtered)
  const displayAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : filteredAppointments;

  // Pagination calculations
  const totalPages = Math.ceil(displayAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = displayAppointments.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Navigate month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Check if date has appointments
  const hasAppointments = (date: Date) => {
    return getAppointmentsForDate(date).length > 0;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatSelectedDate = () => {
    if (!selectedDate) {
      return 'All Appointments';
    }
    if (isToday(selectedDate)) {
      return 'Today';
    }
    return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const branchOptions = [
    { label: 'All Branches', value: 'all' },
    ...Object.entries(branches).map(([id, name]) => ({
      label: name,
      value: id,
    })),
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScreenWrapper title="My Schedule" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Branch Filter */}
        <StylistSection style={styles.branchFilterSection}>
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

        {/* Search and Sort */}
        <StylistSection>
          <View style={styles.searchSortRow}>
            <View style={styles.searchBarContainer}>
              <StylistSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name..."
              />
            </View>
            <View style={styles.sortButtons}>
              {/* Calendar Toggle Button */}
              <TouchableOpacity
                style={[
                  styles.sortButton, 
                  (showCalendar || selectedDate) && styles.sortButtonActive
                ]}
                onPress={() => setShowCalendar(!showCalendar)}
              >
                <Ionicons 
                  name={selectedDate ? "calendar" : "calendar-outline"} 
                  size={18} 
                  color={(showCalendar || selectedDate) ? '#FFFFFF' : '#6B7280'} 
                />
                {selectedDate && !showCalendar && (
                  <View style={styles.dateIndicatorDot} />
                )}
              </TouchableOpacity>
              
              {/* Sort Dropdown Button */}
              <View style={styles.sortContainer}>
                <TouchableOpacity 
                  style={[styles.sortButton, sortDropdownVisible && styles.sortButtonActive]}
                  onPress={() => setSortDropdownVisible(!sortDropdownVisible)}
                >
                  <Ionicons 
                    name="swap-vertical" 
                    size={18} 
                    color={sortDropdownVisible ? '#FFFFFF' : '#6B7280'} 
                  />
                </TouchableOpacity>
                {/* Sort Dropdown Menu */}
                {sortDropdownVisible && (
                  <View style={styles.sortDropdown}>
                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'time-asc' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('time-asc');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="time-outline" 
                        size={18} 
                        color={sortBy === 'time-asc' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'time-asc' && styles.sortDropdownTextActive]}>
                        Time (Earliest First)
                      </Text>
                      {sortBy === 'time-asc' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'time-desc' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('time-desc');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="time-outline" 
                        size={18} 
                        color={sortBy === 'time-desc' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'time-desc' && styles.sortDropdownTextActive]}>
                        Time (Latest First)
                      </Text>
                      {sortBy === 'time-desc' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'client-asc' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('client-asc');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="person-outline" 
                        size={18} 
                        color={sortBy === 'client-asc' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'client-asc' && styles.sortDropdownTextActive]}>
                        Client Name (A-Z)
                      </Text>
                      {sortBy === 'client-asc' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'client-desc' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('client-desc');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="person-outline" 
                        size={18} 
                        color={sortBy === 'client-desc' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'client-desc' && styles.sortDropdownTextActive]}>
                        Client Name (Z-A)
                      </Text>
                      {sortBy === 'client-desc' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'status' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('status');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="flag-outline" 
                        size={18} 
                        color={sortBy === 'status' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'status' && styles.sortDropdownTextActive]}>
                        Status
                      </Text>
                      {sortBy === 'status' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Calendar Grid (Collapsible) */}
        {showCalendar && (
          <StylistSection style={styles.calendarSection}>
            <View style={styles.calendarContainer}>
              {/* Month Navigation */}
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
                  <Ionicons name="chevron-back" size={24} color="#160B53" />
                </TouchableOpacity>
                <View style={styles.monthTitleContainer}>
                  <Text style={styles.monthTitle}>
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
                    <Text style={styles.todayButtonText}>Today</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
                  <Ionicons name="chevron-forward" size={24} color="#160B53" />
                </TouchableOpacity>
              </View>

              {/* Week Day Headers */}
              <View style={styles.weekDaysRow}>
                {weekDays.map((day) => (
                  <View key={day} style={styles.weekDayCell}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Dates */}
              <View style={styles.calendarGrid}>
                {calendarDates.map((date, index) => {
                  const dateHasAppointments = hasAppointments(date);
                  const dateIsToday = isToday(date);
                  const dateIsSelected = isSelected(date);
                  const dateIsCurrentMonth = isCurrentMonth(date);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateCell,
                        dateIsToday && styles.dateCellToday,
                        dateIsSelected && styles.dateCellSelected,
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        styles.dateText,
                        !dateIsCurrentMonth && styles.dateTextOtherMonth,
                        dateIsToday && styles.dateTextToday,
                        dateIsSelected && styles.dateTextSelected,
                      ]}>
                        {date.getDate()}
                      </Text>
                      {dateHasAppointments && (
                        <View style={[
                          styles.appointmentDot,
                          dateIsSelected && styles.appointmentDotSelected
                        ]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </StylistSection>
        )}

        {/* Appointments List */}
        <StylistSection>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{formatSelectedDate()}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{displayAppointments.length}</Text>
            </View>
          </View>
          
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.emptyStateText}>Loading schedule...</Text>
            </View>
          ) : displayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-clear" size={48} color="#10B981" />
              </View>
              <Text style={styles.emptyStateTitle}>Free Day!</Text>
              <Text style={styles.emptyStateText}>
                No appointments scheduled for {formatSelectedDate()}. Enjoy your free time!
              </Text>
              <View style={styles.emptyStateHint}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.emptyStateHintText}>
                  The receptionist will assign new appointments to you
                </Text>
              </View>
            </View>
          ) : (
            <>
            <ScrollView 
              style={styles.appointmentListScroll}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
            {paginatedAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentLeft}>
                  <View style={styles.appointmentIcon}>
                    <Ionicons name="calendar" size={20} color="#4A90E2" />
                  </View>
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.clientName}>{appointment.clientName}</Text>
                    <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>{appointment.time}</Text>
                      </View>
                      <View style={styles.appointmentInfoItem}>
                        <Ionicons name="location" size={14} color="#666" />
                        <Text style={styles.appointmentInfoText}>{appointment.branchName}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.appointmentRight}>
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
            ))}
            </ScrollView>
            <StylistPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={displayAppointments.length}
              itemsPerPage={itemsPerPage}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
            />
            </>
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
  monthSection: {
    marginTop: 0,
    marginBottom: 8,
  },
  branchFilterSection: {
    marginTop: 0,
    marginBottom: 8,
  },
  calendarSection: {
    marginTop: 0,
    marginBottom: 8,
  },
  // Scrollable Appointment List (responsive to screen height)
  appointmentListScroll: {
    maxHeight: Dimensions.get('window').height * 0.5, // 50% of screen height
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  branchFilterScroll: {
    flexDirection: 'row',
  },
  branchChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  // Month Navigation
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: APP_CONFIG.primaryColor,
  },
  todayButtonText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  // Calendar Styles
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    width: (width - 56) / 7,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: (width - 56) / 7,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  dateCellToday: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dateCellSelected: {
    backgroundColor: APP_CONFIG.primaryColor,
  },
  dateText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#111827',
  },
  dateTextOtherMonth: {
    color: '#D1D5DB',
  },
  dateTextToday: {
    color: '#F59E0B',
    fontFamily: FONTS.bold,
  },
  dateTextSelected: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  appointmentDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: APP_CONFIG.primaryColor,
  },
  appointmentDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 12,
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
  clientName: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? FONTS.medium : 'Poppins_600SemiBold',
  },
  serviceName: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.regular,
  },
  appointmentRight: {
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
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
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
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
  // Search and Sort Styles
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 0,
  },
  sortContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonActive: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  dateIndicatorDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  sortDropdown: {
    position: 'absolute',
    top: 50,
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
    minWidth: 200,
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
  // List Header (consistent with other pages)
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
});
