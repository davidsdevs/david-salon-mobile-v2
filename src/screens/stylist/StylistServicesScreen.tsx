import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { useAuth } from '../../hooks/redux';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistSearchBar,
  StylistFilterTab,
  StylistCard,
  StylistBadge,
  StylistPagination,
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';

const { width } = Dimensions.get('window');

export default function StylistServicesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const [clients, setClients] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, selectedStatus, searchQuery, startDate, endDate]);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  interface Transaction {
    id: string;
    name: string;
    service: string;
    date: string;
    type: 'X' | 'R' | 'TR';
    amount: string;
    paymentMethod: string;
    status: string;
    isWalkIn: boolean;
    clientInfo: {
      name: string;
      email: string;
      phone: string;
    };
  }

  // Set up real-time subscription for transactions data
  useEffect(() => {
    if (!user?.id && !user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const stylistId = user.uid || user.id;
    console.log('🔄 Setting up real-time subscription for transactions of stylist:', stylistId);

    const transactionsRef = collection(db, 'transactions');
    
    // Set up real-time listener for transactions
    const unsubscribe = onSnapshot(transactionsRef, async (querySnapshot) => {
      try {
        console.log('📡 Real-time update received for transactions:', querySnapshot.size, 'total');
        
        const transactionsList: Transaction[] = [];
        
        querySnapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          
          // Check if this transaction has services for this stylist
          if (data['services'] && Array.isArray(data['services'])) {
            data['services'].forEach((service: any) => {
              if (service.stylistId === stylistId) {
                // Map client type from service
                let clientType: 'X' | 'R' | 'TR' = 'R';
                if (service.clientType === 'X') clientType = 'X';
                else if (service.clientType === 'R') clientType = 'R';
                else if (service.clientType === 'TR') clientType = 'TR';
                
                // Format date
                const transactionDate = data['createdAt']?.toDate 
                  ? new Date(data['createdAt'].toDate()).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })
                  : 'N/A';
                
                transactionsList.push({
                  id: docSnap.id,
                  name: data['clientInfo']?.name || 'Unknown Client',
                  service: service.serviceName || 'Unknown Service',
                  date: transactionDate,
                  type: clientType,
                  amount: `₱${(Number(service.adjustedPrice) || 0).toFixed(2)}`,
                  paymentMethod: data['paymentMethod'] || 'N/A',
                  status: data['status'] || 'pending',
                  isWalkIn: !data['appointmentId'], // No appointmentId means walk-in
                  clientInfo: {
                    name: data['clientInfo']?.name || 'Unknown',
                    email: data['clientInfo']?.email || 'N/A',
                    phone: data['clientInfo']?.phone || 'N/A',
                  },
                });
              }
            });
          }
        });
        
        // Sort by status (in_service first) then by date (newest first)
        transactionsList.sort((a, b) => {
          // Prioritize "in_service" status
          const aIsInService = a.status.toLowerCase() === 'in_service' || a.status.toLowerCase() === 'in service';
          const bIsInService = b.status.toLowerCase() === 'in_service' || b.status.toLowerCase() === 'in service';
          
          if (aIsInService && !bIsInService) return -1;
          if (!aIsInService && bIsInService) return 1;
          
          // If both have same status priority, sort by date (newest first)
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        console.log('✅ Real-time transactions update:', transactionsList.length);
        setClients(transactionsList);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error processing real-time transactions update:', error);
        setClients([]);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time transactions listener error:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 Cleaning up transactions subscription');
      unsubscribe();
    };
  }, [user?.id, user?.uid]);

  const filterOptions = ['All Types', 'X', 'R', 'TR'];
  const statusFilterOptions = ['All', 'In Service', 'Paid'];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All Types' || client.type === selectedFilter;
    
    // Status filter logic
    let matchesStatus = true;
    if (selectedStatus === 'In Service') {
      matchesStatus = client.status.toLowerCase() === 'in service' || client.status.toLowerCase() === 'in_service';
    } else if (selectedStatus === 'Paid') {
      matchesStatus = client.status.toLowerCase() === 'paid' || client.status.toLowerCase() === 'completed';
    }
    // 'All' shows everything
    
    // Date range filter logic
    let matchesDate = true;
    if (startDate || endDate) {
      const transactionDate = new Date(client.date);
      transactionDate.setHours(0, 0, 0, 0);
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = transactionDate >= start && transactionDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = transactionDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = transactionDate <= end;
      }
    }
    
    return matchesSearch && matchesFilter && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const handleViewProfile = (transaction: Transaction) => {
    (navigation as any).navigate('StylistTransactionDetails', { client: transaction });
  };

  const getClientTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'X - New Client':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'R - Regular':
        return { bg: '#FCE7F3', text: '#9F1239', border: '#FBCFE8' };
      case 'TR - Transfer':
        return { bg: '#CCFBF1', text: '#115E59', border: '#99F6E4' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    }
  };

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Filter Category */}
        <StylistSection>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFiltersScroll}>
            <View style={styles.quickFiltersCompact}>
              {statusFilterOptions.map((filter: string) => {
                const count = clients.filter(c => {
                  if (filter === 'All') return true;
                  if (filter === 'In Service') return c.status.toLowerCase() === 'in_service' || c.status.toLowerCase() === 'in service';
                  if (filter === 'Paid') return c.status.toLowerCase() === 'paid' || c.status.toLowerCase() === 'completed';
                  return false;
                }).length;

                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.quickFilterChip,
                      selectedStatus === filter && styles.quickFilterChipActive
                    ]}
                    onPress={() => setSelectedStatus(filter)}
                  >
                    <Text style={[
                      styles.quickFilterText,
                      selectedStatus === filter && styles.quickFilterTextActive
                    ]}>
                      {filter}
                    </Text>
                    {count > 0 && (
                      <View style={[
                        styles.quickFilterBadge,
                        selectedStatus === filter && styles.quickFilterBadgeActive
                      ]}>
                        <Text style={[
                          styles.quickFilterBadgeText,
                          selectedStatus === filter && styles.quickFilterBadgeTextActive
                        ]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </StylistSection>

        {/* Search Header */}
        <StylistSection isTitle>
          <View style={styles.headerRow}>
            <StylistSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by client or service..."
            />
          </View>
        </StylistSection>

        {/* Client Type Filter Tabs */}
        <StylistSection>
          <View style={styles.filterTabs}>
            {filterOptions.map((filter) => {
              const getVariant = () => {
                if (filter === 'X') return 'new-client';
                if (filter === 'R') return 'regular';
                if (filter === 'TR') return 'transfer';
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
        </StylistSection>

        {/* Client List */}
        <StylistSection>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.loadingText}>Loading service history...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people" size={48} color="#EC4899" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Records' : 'No Service History'}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery 
                  ? `No records match "${searchQuery}". Try a different search term.`
                  : selectedFilter !== 'All Types'
                    ? `No ${selectedFilter.replace('X - ', '').replace('R - ', '').replace('TR - ', '').toLowerCase()} transactions found.`
                    : 'Your service history will appear here after completing appointments.'}
              </Text>
              {searchQuery && (
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={18} color="#160B53" />
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            paginatedClients.map((client) => {
              const getVariant = () => {
                if (client.type === 'X') return 'new-client';
                if (client.type === 'R') return 'regular';
                if (client.type === 'TR') return 'transfer';
                return 'default';
              };
              return (
                <TouchableOpacity 
                  key={client.id}
                  style={styles.clientCard}
                  onPress={() => handleViewProfile(client)}
                >
                  <View style={styles.clientLeft}>
                    <View style={styles.clientAvatar}>
                      <Ionicons name="person" size={32} color="#999" />
                    </View>
                    <View style={styles.clientInfo}>
                      <View style={styles.clientNameRow}>
                        <Text style={styles.clientName}>{client.name}</Text>
                        <StylistBadge label={client.type} variant={getVariant()} size="small" />
                      </View>
                      <Text style={styles.clientService}>{client.service}</Text>
                      <View style={styles.clientInfoRow}>
                        <View style={styles.clientInfoItem}>
                          <Ionicons name="calendar-outline" size={14} color="#666" />
                          <Text style={styles.clientInfoText}>{client.date}</Text>
                        </View>
                        {client.isWalkIn && (
                          <StylistBadge 
                            label="Walk-in" 
                            variant="in-service" 
                            size="small" 
                          />
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.clientRight}>
                    <Text style={styles.priceText}>{client.amount}</Text>
                    {client.status && (
                      <StylistBadge 
                        label={client.status === 'in_service' || client.status === 'in service' ? 'In Service' : 'Paid'} 
                        variant={client.status === 'in_service' || client.status === 'in service' ? 'in-service' : 'completed'} 
                        size="small" 
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </StylistSection>
      </View>
    );
  }

  // Calculate stats
  const stats = {
    total: clients.length,
    newClients: clients.filter(c => c.type === 'X - New Client').length,
    regular: clients.filter(c => c.type === 'R - Regular').length,
    transfer: clients.filter(c => c.type === 'TR - Transfer').length,
  };
  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Services" userType="stylist" showBackButton={false}>
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Filter Category */}
        <StylistSection>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFiltersScroll}>
            <View style={styles.quickFiltersCompact}>
              {statusFilterOptions.map((filter: string) => {
                const count = clients.filter(c => {
                  if (filter === 'All') return true;
                  if (filter === 'In Service') return c.status.toLowerCase() === 'in_service' || c.status.toLowerCase() === 'in service';
                  if (filter === 'Paid') return c.status.toLowerCase() === 'paid' || c.status.toLowerCase() === 'completed';
                  return false;
                }).length;

                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.quickFilterChip,
                      selectedStatus === filter && styles.quickFilterChipActive
                    ]}
                    onPress={() => setSelectedStatus(filter)}
                  >
                    <Text style={[
                      styles.quickFilterText,
                      selectedStatus === filter && styles.quickFilterTextActive
                    ]}>
                      {filter}
                    </Text>
                    {count > 0 && (
                      <View style={[
                        styles.quickFilterBadge,
                        selectedStatus === filter && styles.quickFilterBadgeActive
                      ]}>
                        <Text style={[
                          styles.quickFilterBadgeText,
                          selectedStatus === filter && styles.quickFilterBadgeTextActive
                        ]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </StylistSection>

        {/* Search and Sort */}
        <StylistSection>
          <View style={styles.searchSortRow}>
            <View style={styles.searchBarContainer}>
              <StylistSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by client or service..."
              />
            </View>
            <View style={styles.sortButtons}>
              {/* Calendar Button */}
              <TouchableOpacity
                style={[
                  styles.sortButton, 
                  (showDateRangePicker || startDate || endDate) && styles.sortButtonActive
                ]}
                onPress={() => setShowDateRangePicker(!showDateRangePicker)}
              >
                <Ionicons 
                  name={(startDate || endDate) ? "calendar" : "calendar-outline"} 
                  size={18} 
                  color={(showDateRangePicker || startDate || endDate) ? '#FFFFFF' : '#6B7280'} 
                />
                {(startDate || endDate) && !showDateRangePicker && (
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
                      style={[styles.sortDropdownItem, selectedFilter === 'All Types' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSelectedFilter('All Types');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="list-outline" 
                        size={18} 
                        color={selectedFilter === 'All Types' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, selectedFilter === 'All Types' && styles.sortDropdownTextActive]}>
                        All Types ({stats.total})
                      </Text>
                      {selectedFilter === 'All Types' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, selectedFilter === 'X - New Client' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSelectedFilter('X - New Client');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="person-add-outline" 
                        size={18} 
                        color={selectedFilter === 'X - New Client' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, selectedFilter === 'X - New Client' && styles.sortDropdownTextActive]}>
                        New Client ({stats.newClients})
                      </Text>
                      {selectedFilter === 'X - New Client' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, selectedFilter === 'R - Regular' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSelectedFilter('R - Regular');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="star-outline" 
                        size={18} 
                        color={selectedFilter === 'R - Regular' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, selectedFilter === 'R - Regular' && styles.sortDropdownTextActive]}>
                        Regular ({stats.regular})
                      </Text>
                      {selectedFilter === 'R - Regular' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, selectedFilter === 'TR - Transfer' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSelectedFilter('TR - Transfer');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="swap-horizontal-outline" 
                        size={18} 
                        color={selectedFilter === 'TR - Transfer' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, selectedFilter === 'TR - Transfer' && styles.sortDropdownTextActive]}>
                        Transfer ({stats.transfer})
                      </Text>
                      {selectedFilter === 'TR - Transfer' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Date Range Picker */}
        {showDateRangePicker && (
          <StylistSection>
            <View style={styles.dateRangeCard}>
              <Text style={styles.dateRangeTitle}>Transaction Date Range</Text>
              
              <View style={styles.dateRangeInputs}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateInputLabel}>Start Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={[styles.dateInputText, startDate && { color: '#160B53' }]}>
                      {startDate ? startDate.toLocaleDateString('en-US') : 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateInputLabel}>End Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={[styles.dateInputText, endDate && { color: '#160B53' }]}>
                      {endDate ? endDate.toLocaleDateString('en-US') : 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dateRangeActions}>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setShowDateRangePicker(false)}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </StylistSection>
        )}
          
        {/* Clients List */}
        <StylistSection>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Service History</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredClients.length}</Text>
            </View>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.loadingText}>Loading service history...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people" size={48} color="#EC4899" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Records' : 'No Service History'}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery 
                  ? `No records match "${searchQuery}". Try a different search term.`
                  : selectedFilter !== 'All Types'
                    ? `No ${selectedFilter.replace('X - ', '').replace('R - ', '').replace('TR - ', '').toLowerCase()} transactions found.`
                    : 'Your service history will appear here after completing appointments.'}
              </Text>
              {searchQuery && (
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={18} color="#160B53" />
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            paginatedClients.map((client) => {
              const getVariant = () => {
                if (client.type === 'X') return 'new-client';
                if (client.type === 'R') return 'regular';
                if (client.type === 'TR') return 'transfer';
                return 'default';
              };
              return (
                <TouchableOpacity 
                  key={client.id}
                  style={styles.clientCard}
                  onPress={() => handleViewProfile(client)}
                >
                  <View style={styles.clientLeft}>
                    <View style={styles.clientAvatar}>
                      <Ionicons name="person" size={28} color="#999" />
                    </View>
                    <View style={styles.clientInfo}>
                      <View style={styles.clientNameRow}>
                        <Text style={styles.clientName}>{client.name}</Text>
                        <StylistBadge label={client.type} variant={getVariant()} size="small" />
                      </View>
                      <Text style={styles.clientService}>{client.service}</Text>
                      <View style={styles.clientInfoRow}>
                        <View style={styles.clientInfoItem}>
                          <Ionicons name="calendar-outline" size={14} color="#666" />
                          <Text style={styles.clientInfoText}>{client.date}</Text>
                        </View>
                        {client.isWalkIn && (
                          <StylistBadge 
                            label="Walk-in" 
                            variant="in-service" 
                            size="small" 
                          />
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.clientRight}>
                    <Text style={styles.priceText}>{client.amount}</Text>
                    {client.status && (
                      <StylistBadge 
                        label={client.status === 'in_service' || client.status === 'in service' ? 'In Service' : 'Paid'} 
                        variant={client.status === 'in_service' || client.status === 'in service' ? 'in-service' : 'completed'} 
                        size="small" 
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <StylistPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClients.length}
              itemsPerPage={itemsPerPage}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
            />
        </StylistSection>
      </ScrollView>

      {/* Date Pickers */}
      <Modal
        visible={showStartDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartDatePicker(false)}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Start Date</Text>
              <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              current={startDate ? startDate.toISOString().split('T')[0] : undefined}
              onDayPress={(day) => {
                setStartDate(new Date(day.dateString));
                setShowStartDatePicker(false);
              }}
              markedDates={startDate ? {
                [startDate.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: APP_CONFIG.primaryColor,
                }
              } : {}}
              theme={{
                todayTextColor: APP_CONFIG.primaryColor,
                selectedDayBackgroundColor: APP_CONFIG.primaryColor,
                selectedDayTextColor: '#FFFFFF',
                arrowColor: APP_CONFIG.primaryColor,
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEndDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select End Date</Text>
              <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              current={endDate ? endDate.toISOString().split('T')[0] : undefined}
              onDayPress={(day) => {
                setEndDate(new Date(day.dateString));
                setShowEndDatePicker(false);
              }}
              markedDates={endDate ? {
                [endDate.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: APP_CONFIG.primaryColor,
                }
              } : {}}
              theme={{
                todayTextColor: APP_CONFIG.primaryColor,
                selectedDayBackgroundColor: APP_CONFIG.primaryColor,
                selectedDayTextColor: '#FFFFFF',
                arrowColor: APP_CONFIG.primaryColor,
              }}
            />
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
  // Scrollable Client List (responsive to screen height)
  clientListScroll: {
    maxHeight: Dimensions.get('window').height * 0.5, // 50% of screen height
  },
  filterSection: {
    marginTop: 0,
    marginBottom: 8,
  },
  searchSection: {
    marginTop: 0,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  legendHeaderText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  clientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  clientName: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  clientService: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  clientInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientInfoText: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    color: '#666',
    marginLeft: 6,
    fontFamily: FONTS.regular,
  },
  clientRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  viewProfileButton: {
    backgroundColor: '#160B53',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 24,
  },
  viewProfileText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    maxWidth: 280,
  },
  clearSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#160B53',
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  // Enhanced Stats Card (consistent with other pages)
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
  totalBadge: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  totalBadgeText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
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
  // Quick Filter Chips with Count Badges (consistent with Appointments page)
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
  },
  quickFilterChipActive: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  quickFilterText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#374151',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  quickFilterBadge: {
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFilterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickFilterBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: APP_CONFIG.primaryColor,
  },
  quickFilterBadgeTextActive: {
    color: '#FFFFFF',
  },
  quickFiltersScroll: {
    marginBottom: 0,
  },
  quickFiltersCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Status Filter Styles
  statusFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
  },
  statusFilterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusFilterTabActive: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  statusFilterText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#374151',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },
  // Date Range Picker Styles
  dateIndicatorDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  dateRangeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateRangeTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 16,
  },
  dateRangeInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  dateInputText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
  dateRangeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: APP_CONFIG.primaryColor,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  // Date Picker Modal Styles
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
  },
  datePickerDone: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: APP_CONFIG.primaryColor,
  },
});
