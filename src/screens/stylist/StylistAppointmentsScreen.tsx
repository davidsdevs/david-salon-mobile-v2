import React, { useState, useEffect, useCallback } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  const scrollViewRef = React.useRef<ScrollView>(null);
  const appointmentListRef = React.useRef<View>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'client'>('time');
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // null = no date filter
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const mainFilterOptions = ['Today', 'Upcoming', 'All'];
  const moreFilterOptions = ['Confirmed', 'Completed', 'Cancelled'];

  // Generate calendar dates for the current month
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    
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
  }, [currentMonth]);

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

  // Calculate stats for summary card
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentDate || apt.date);
    const today = new Date();
    return aptDate.getDate() === today.getDate() &&
           aptDate.getMonth() === today.getMonth() &&
           aptDate.getFullYear() === today.getFullYear();
  });

  const stats = {
    total: todayAppointments.length,
    confirmed: todayAppointments.filter((a: any) => a.status === 'confirmed').length,
    pending: todayAppointments.filter((a: any) => a.status === 'scheduled' || a.status === 'pending').length,
    inService: todayAppointments.filter((a: any) => a.status === 'in-service' || a.status === 'in_service' || a.status === 'in_progress').length,
    nextAppointment: todayAppointments
      .filter((a: any) => a.status !== 'completed' && a.status !== 'cancelled')
      .sort((a: any, b: any) => {
        const timeA = a.appointmentTime || a.startTime || '';
        const timeB = b.appointmentTime || b.startTime || '';
        return timeA.localeCompare(timeB);
      })[0],
  };

  const filteredAppointments = appointments.filter(appointment => {
    // Use real Firebase data fields with type casting
    const apt = appointment as any;
    const clientName = apt.clientName || 
                      `${apt.clientFirstName || ''} ${apt.clientLastName || ''}`.trim() ||
                      'Unknown Client';
    
    // Search in service names (handle multiple services)
    let serviceNames = '';
    if (apt.serviceStylistPairs && apt.serviceStylistPairs.length > 0) {
      serviceNames = apt.serviceStylistPairs.map((p: any) => p.serviceName).join(' ');
    } else if (appointment.service?.name) {
      serviceNames = appointment.service.name;
    }
    
    const matchesSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         serviceNames.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 1. Filter by selected date (if date picker is used)
    let matchesDate = true;
    if (selectedDate) {
      const appointmentDate = new Date(apt.appointmentDate || apt.date);
      appointmentDate.setHours(0, 0, 0, 0);
      const selectedDateNormalized = new Date(selectedDate);
      selectedDateNormalized.setHours(0, 0, 0, 0);
      matchesDate = appointmentDate.getTime() === selectedDateNormalized.getTime();
    }
    
    // 2. Filter by status (if status filter is active)
    let matchesFilter = false;
    const appointmentDate = new Date(apt.appointmentDate || apt.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Normalize status for comparison (handle different status formats)
    const status = (appointment.status || '').toLowerCase();
    
    switch (selectedFilter) {
      case 'Today':
        // Today shows ALL appointments scheduled for today (any status except cancelled)
        const aptDate = new Date(appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        matchesFilter = aptDate.getTime() === today.getTime() && status !== 'cancelled';
        break;
      case 'Upcoming':
        // Upcoming shows scheduled/confirmed appointments from tomorrow onwards
        matchesFilter = appointmentDate >= tomorrow && 
                       (status === 'scheduled' || status === 'confirmed' || status === 'pending');
        break;
      case 'All':
        // Show all appointments (except cancelled by default)
        matchesFilter = status !== 'cancelled';
        break;
      case 'Confirmed':
        // Confirmed shows only confirmed appointments
        matchesFilter = status === 'confirmed';
        break;
      case 'Completed':
        // Completed shows only completed appointments
        matchesFilter = status === 'completed';
        break;
      case 'Cancelled':
        // Cancelled shows only cancelled appointments
        matchesFilter = status === 'cancelled';
        break;
      default:
        matchesFilter = true;
    }
    
    return matchesSearch && matchesDate && matchesFilter;
  }).sort((a, b) => {
    const aptA = a as any;
    const aptB = b as any;
    
    // Sort appointments based on selected sort option
    switch (sortBy) {
      case 'time':
        // Sort by appointment date first, then time
        const dateA = new Date(aptA.appointmentDate || aptA.date).getTime();
        const dateB = new Date(aptB.appointmentDate || aptB.date).getTime();
        if (dateA !== dateB) {
          return dateA - dateB; // Earlier dates first
        }
        // If same date, sort by time
        const timeA = aptA.appointmentTime || aptA.startTime || '';
        const timeB = aptB.appointmentTime || aptB.startTime || '';
        return timeA.localeCompare(timeB);
      case 'client':
        // Sort by client name
        const clientA = (aptA.clientName || `${aptA.clientFirstName || ''} ${aptA.clientLastName || ''}`.trim() || '').toLowerCase();
        const clientB = (aptB.clientName || `${aptB.clientFirstName || ''} ${aptB.clientLastName || ''}`.trim() || '').toLowerCase();
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

  // Calendar helper functions
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const hasAppointments = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.some((apt: any) => {
      const aptDate = new Date(apt.appointmentDate || apt.date);
      return aptDate.toISOString().split('T')[0] === dateStr;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    scrollToAppointmentList();
  };

  // Scroll to appointment list when date is selected
  const scrollToAppointmentList = () => {
    // Close calendar first for better UX
    setShowCalendar(false);
    
    // Then scroll to the appointment list
    setTimeout(() => {
      // Scroll to appointment list section
      // Using a more reliable method with onLayout measurement
      appointmentListRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        },
        () => {
          // Fallback if measurement fails
          scrollViewRef.current?.scrollTo({ y: 600, animated: true });
        }
      );
    }, 100);
  };

  // Mobile-first responsive layout
  return (
    <ScreenWrapper title="Appointments" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Quick Filters */}
        <StylistSection>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterTabs}>
              {/* Main Filters */}
              {mainFilterOptions.map((filter: string) => {
                // Count appointments using the SAME logic as the main filter
                const count = appointments.filter(apt => {
                  const aptAny = apt as any;
                  const appointmentDate = new Date(aptAny.appointmentDate || aptAny.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  const status = (apt.status || '').toLowerCase();
                  
                  if (filter === 'Today') {
                    const aptDate = new Date(appointmentDate);
                    aptDate.setHours(0, 0, 0, 0);
                    return aptDate.getTime() === today.getTime() && status !== 'cancelled';
                  }
                  if (filter === 'Upcoming') {
                    return appointmentDate >= tomorrow && 
                           (status === 'scheduled' || status === 'confirmed' || status === 'pending');
                  }
                  if (filter === 'All') {
                    return status !== 'cancelled';
                  }
                  return false;
                }).length;

                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.quickFilterChip,
                      selectedFilter === filter && styles.quickFilterChipActive
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text style={[
                      styles.quickFilterText,
                      selectedFilter === filter && styles.quickFilterTextActive
                    ]}>
                      {filter}
                    </Text>
                    {count > 0 && (
                      <View style={[
                        styles.quickFilterBadge,
                        selectedFilter === filter && styles.quickFilterBadgeActive
                      ]}>
                        <Text style={[
                          styles.quickFilterBadgeText,
                          selectedFilter === filter && styles.quickFilterBadgeTextActive
                        ]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              
              {/* More Filters Dropdown */}
              <TouchableOpacity
                style={[
                  styles.quickFilterChip,
                  moreFilterOptions.includes(selectedFilter) && styles.quickFilterChipActive
                ]}
                onPress={() => setShowMoreFilters(!showMoreFilters)}
              >
                <Text style={[
                  styles.quickFilterText,
                  moreFilterOptions.includes(selectedFilter) && styles.quickFilterTextActive
                ]}>
                  More
                </Text>
                <Ionicons 
                  name={showMoreFilters ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={moreFilterOptions.includes(selectedFilter) ? '#FFFFFF' : '#374151'} 
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          {/* More Filters Dropdown Content */}
          {showMoreFilters && (
            <View style={styles.moreFiltersDropdown}>
              {moreFilterOptions.map((filter: string) => {
                const count = appointments.filter(apt => {
                  const status = (apt.status || '').toLowerCase();
                  if (filter === 'Confirmed') return status === 'confirmed';
                  if (filter === 'Completed') return status === 'completed';
                  if (filter === 'Cancelled') return status === 'cancelled';
                  return false;
                }).length;

                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.moreFilterItem,
                      selectedFilter === filter && styles.moreFilterItemActive
                    ]}
                    onPress={() => {
                      setSelectedFilter(filter);
                      setShowMoreFilters(false);
                    }}
                  >
                    <Text style={[
                      styles.moreFilterText,
                      selectedFilter === filter && styles.moreFilterTextActive
                    ]}>
                      {filter}
                    </Text>
                    {count > 0 && (
                      <View style={styles.moreFilterBadge}>
                        <Text style={styles.moreFilterBadgeText}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'time' && styles.sortButtonActive]}
                onPress={() => setSortBy('time')}
              >
                <Ionicons name="time" size={18} color={sortBy === 'time' ? '#FFFFFF' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'client' && styles.sortButtonActive]}
                onPress={() => setSortBy('client')}
              >
                <Ionicons name="person" size={18} color={sortBy === 'client' ? '#FFFFFF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>
        </StylistSection>

        {/* Calendar View */}
        {showCalendar && (
          <StylistSection>
            <View style={styles.calendarCard}>
              {/* Month Navigation */}
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
                  <Ionicons name="chevron-back" size={24} color="#160B53" />
                </TouchableOpacity>
                <View style={styles.monthTitleContainer}>
                  <Text style={styles.monthTitle}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <View key={day} style={styles.weekDayCell}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
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
                      onPress={() => {
                        setSelectedDate(date);
                        scrollToAppointmentList();
                      }}
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
          <View ref={appointmentListRef} collapsable={false}>
          {/* Section Header with Count */}
          <View style={styles.listHeader}>
            <View style={styles.listTitleContainer}>
              <Text style={styles.listTitle}>
                {selectedDate 
                  ? `Appointments on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : selectedFilter === 'Today' 
                    ? "Today's Appointments"
                    : `${selectedFilter} Appointments`
                }
              </Text>
              {selectedDate && (
                <TouchableOpacity 
                  style={styles.clearDateButton}
                  onPress={() => setSelectedDate(null)}
                >
                  <Ionicons name="close-circle" size={16} color="#6B7280" />
                  <Text style={styles.clearDateText}>Clear date</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredAppointments.length}</Text>
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
              <Text style={styles.emptyStateTitle}>No Appointments Found</Text>
              <Text style={styles.emptyStateText}>
                {selectedDate 
                  ? `No appointments scheduled for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`
                  : selectedFilter === 'Today' 
                    ? 'You have no appointments scheduled for today. Enjoy your free time!' 
                    : selectedFilter === 'Upcoming' 
                      ? 'You have no upcoming appointments scheduled.'
                      : selectedFilter === 'Confirmed' 
                        ? 'You have no confirmed appointments.'
                        : selectedFilter === 'Completed' 
                          ? 'You have no completed appointments yet.'
                          : selectedFilter === 'Cancelled' 
                            ? 'You have no cancelled appointments.'
                            : 'Try adjusting your filters or search terms.'}
              </Text>
              {(selectedDate || searchQuery) && (
                <TouchableOpacity 
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSelectedDate(null);
                    setSearchQuery('');
                    setSelectedFilter('Today');
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ScrollView 
              style={styles.appointmentListScroll}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
            {filteredAppointments.map((appointment, index) => {
              // Determine if this is the next appointment (first pending/confirmed/scheduled)
              const isNextAppointment = index === 0 && 
                (appointment.status === 'confirmed' || 
                 appointment.status === 'scheduled' || 
                 appointment.status === 'pending') &&
                selectedFilter === 'Today';
              
              return (
            <TouchableOpacity 
              key={appointment.id} 
              style={[
                styles.appointmentCard,
                isNextAppointment && styles.nextAppointmentCard
              ]}
              onPress={() => handleAppointmentPress(appointment)}
            >
              {/* Next Up Badge */}
              {isNextAppointment && (
                <View style={styles.nextUpBadge}>
                  <Ionicons name="flash" size={12} color="#FFFFFF" />
                  <Text style={styles.nextUpText}>NEXT UP</Text>
                </View>
              )}
              
              <View style={styles.appointmentLeft}>
                <View style={[
                  styles.appointmentIcon,
                  isNextAppointment && styles.nextAppointmentIcon
                ]}>
                  <Ionicons 
                    name={isNextAppointment ? "flash" : "calendar"} 
                    size={20} 
                    color={isNextAppointment ? "#10B981" : "#4A90E2"} 
                  />
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
                        {(appointment as any).appointmentTime || (appointment as any).startTime || 'N/A'}
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
              );
            })}
            </ScrollView>
          )}
          </View>
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
                      <Ionicons name="location-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Branch</Text>
                        <Text style={styles.modalDetailValue}>
                          {(selectedAppointment as any).branchName || 'Not specified'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="hourglass-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Duration</Text>
                        <Text style={styles.modalDetailValue}>
                          {(() => {
                            if ((selectedAppointment as any).serviceStylistPairs && (selectedAppointment as any).serviceStylistPairs.length > 0) {
                              const totalMinutes = (selectedAppointment as any).serviceStylistPairs.reduce(
                                (sum: number, pair: any) => sum + (pair.serviceDuration || 60), 
                                0
                              );
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
                            }
                            return (selectedAppointment as any).duration ? `${(selectedAppointment as any).duration} min` : 'N/A';
                          })()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="cash-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Price</Text>
                        <Text style={styles.modalDetailValue}>
                          ₱{(selectedAppointment as any).price || (selectedAppointment as any).finalPrice || 0}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="card-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Payment Status</Text>
                        <StylistBadge
                          label={(selectedAppointment as any).paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                          variant={(selectedAppointment as any).paymentStatus === 'paid' ? 'completed' : 'default'}
                          size="small"
                        />
                      </View>
                    </View>

                    {(selectedAppointment as any).clientPhone && (
                      <View style={styles.modalDetailRow}>
                        <Ionicons name="call-outline" size={20} color="#666" />
                        <View style={styles.modalDetailContent}>
                          <Text style={styles.modalDetailLabel}>Phone</Text>
                          <Text style={styles.modalDetailValue}>
                            {(selectedAppointment as any).clientPhone}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.modalDetailRow}>
                      <Ionicons name="document-text-outline" size={20} color="#666" />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Notes</Text>
                        <Text style={styles.modalDetailValue}>
                          {(selectedAppointment as any).notes || 'No notes'}
                        </Text>
                      </View>
                    </View>

                    {(selectedAppointment as any).allergies && (
                      <View style={styles.alertBanner}>
                        <Ionicons name="warning" size={20} color="#EF4444" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.alertTitle}>⚠️ Allergies / Special Notes</Text>
                          <Text style={styles.alertText}>
                            {(selectedAppointment as any).allergies}
                          </Text>
                        </View>
                      </View>
                    )}

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
  filterSection: {
    marginTop: 0,
    marginBottom: 8,
  },
  searchSection: {
    marginTop: 0,
  },
  // Scrollable Appointment List (responsive to screen height)
  appointmentListScroll: {
    maxHeight: Dimensions.get('window').height * 0.5, // 50% of screen height
  },
  // Stats Summary Card
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
  statsDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
  },
  nextAppointmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  nextAppointmentText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#160B53',
    flex: 1,
  },
  // Date Picker Carousel
  datePickerContainer: {
    paddingRight: 16,
  },
  datePickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    minWidth: 70,
  },
  datePickerItemSelected: {
    backgroundColor: APP_CONFIG.primaryColor,
  },
  datePickerItemToday: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  datePickerDay: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginBottom: 4,
  },
  datePickerDaySelected: {
    color: '#FFFFFF',
  },
  datePickerDate: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  datePickerDateSelected: {
    color: '#FFFFFF',
  },
  // Date Filter Banner
  dateFilterBanner: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: APP_CONFIG.primaryColor,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateFilterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateFilterText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#160B53',
    flex: 1,
  },
  // Calendar Styles
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  // Quick Filter Chips with Count Badges
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  quickFilterChipActive: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  quickFilterText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  quickFilterBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  quickFilterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickFilterBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#374151',
  },
  quickFilterBadgeTextActive: {
    color: '#FFFFFF',
  },
  // More Filters Dropdown
  moreFiltersDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moreFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  moreFilterItemActive: {
    backgroundColor: '#F3F4F6',
  },
  moreFilterText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#374151',
  },
  moreFilterTextActive: {
    color: APP_CONFIG.primaryColor,
    fontFamily: FONTS.semiBold,
  },
  moreFilterBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  moreFilterBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#374151',
  },
  // Search and Sort Row
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
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  // List Header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  clearDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  clearDateText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#6B7280',
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
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: APP_CONFIG.primaryColor,
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  // Alert Banner for Allergies/Special Notes
  alertBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#EF4444',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#991B1B',
    lineHeight: 18,
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
  nextAppointmentCard: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
  },
  nextUpBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  nextUpText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  nextAppointmentIcon: {
    backgroundColor: '#D1FAE5',
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
    gap: 4,
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
