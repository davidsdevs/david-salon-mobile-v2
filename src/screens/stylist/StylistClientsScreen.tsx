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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';

const { width } = Dimensions.get('window');

export default function StylistClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Clients');
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  interface Client {
    id: number;
    name: string;
    service: string;
    duration: string;
    type: 'X - New Client' | 'R - Regular' | 'TR - Transfer';
    notes: string;
    phone: string;
    email: string;
    memberSince: string;
    totalVisits: number;
    lastVisit: string;
    totalSpent: string;
    allergies?: string;
    colorFormula?: string;
  }

  // Set up real-time subscription for clients data
  useEffect(() => {
    if (!user?.id && !user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const stylistId = user.uid || user.id;
    console.log('🔄 Setting up real-time subscription for clients of stylist:', stylistId);

    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    
    // Set up real-time listener for appointments
    const unsubscribe = onSnapshot(appointmentsRef, async (querySnapshot) => {
      try {
        console.log('📡 Real-time update received for clients:', querySnapshot.size, 'appointments');
        
        const allAppointments: any[] = [];
        
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          const hasStylist = data.stylistId === stylistId || 
                            data.assignedStylistId === stylistId ||
                            (data.serviceStylistPairs && data.serviceStylistPairs.some((p: any) => p.stylistId === stylistId));
          if (hasStylist) {
            allAppointments.push({ id: doc.id, ...data });
          }
        });

        console.log('📊 Total appointments found:', allAppointments.length);

        // Remove duplicates
        const uniqueAppointments = allAppointments.filter((apt, index, self) => 
          index === self.findIndex(a => a.id === apt.id)
        );

        const clientMap = new Map();

        // Process each appointment to build client list
        for (const appointmentData of uniqueAppointments) {
          const clientId = appointmentData.clientId;

          if (!clientId) continue;

          if (!clientMap.has(clientId)) {
            // Fetch client details
            const clientDoc = await getDoc(doc(db, COLLECTIONS.USERS, clientId));
            if (clientDoc.exists()) {
              const clientData = clientDoc.data();
              
              // Count appointments for this client with this stylist
              const clientAppointments = uniqueAppointments.filter(apt => 
                apt.clientId === clientId && apt.status !== 'cancelled'
              );
              
              // Determine client type based on appointment count
              let clientType: 'X - New Client' | 'R - Regular' | 'TR - Transfer' = 'R - Regular';
              if (clientAppointments.length === 1) {
                clientType = 'X - New Client';
              } else if (clientAppointments.length >= 2) {
                clientType = 'R - Regular';
              }
              
              // Check if client has clientType field in their data
              if (clientData.clientType) {
                if (clientData.clientType === 'new') clientType = 'X - New Client';
                else if (clientData.clientType === 'regular') clientType = 'R - Regular';
                else if (clientData.clientType === 'transfer') clientType = 'TR - Transfer';
              }
              
              // Calculate total spent
              const totalSpent = clientAppointments.reduce((sum, apt) => {
                return sum + (apt.price || apt.finalPrice || 0);
              }, 0);
              
              // Get last visit date
              const sortedAppointments = clientAppointments
                .filter(apt => apt.appointmentDate || apt.date)
                .sort((a, b) => {
                  const dateA = new Date(a.appointmentDate || a.date);
                  const dateB = new Date(b.appointmentDate || b.date);
                  return dateB.getTime() - dateA.getTime();
                });
              
              const lastVisit = sortedAppointments.length > 0 
                ? new Date(sortedAppointments[0].appointmentDate || sortedAppointments[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'N/A';
              
              clientMap.set(clientId, {
                id: clientId,
                name: `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || 'Unknown Client',
                service: 'Various Services',
                duration: '1-3 hours',
                type: clientType,
                notes: clientData.notes || '',
                phone: clientData.phone || 'N/A',
                email: clientData.email || 'N/A',
                memberSince: clientData.memberSince?.toDate ? new Date(clientData.memberSince.toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A',
                totalVisits: clientAppointments.length,
                lastVisit: lastVisit,
                totalSpent: `₱${totalSpent.toFixed(2)}`,
                allergies: clientData.allergies || 'None',
                colorFormula: clientData.colorFormula || '',
              });
            }
          }
        }

        const clientsList = Array.from(clientMap.values());
        console.log('✅ Real-time clients update:', clientsList.length);
        setClients(clientsList);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error processing real-time clients update:', error);
        setClients([]);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time clients listener error:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 Cleaning up clients subscription');
      unsubscribe();
    };
  }, [user?.id, user?.uid]);

  const filterOptions = ['All Clients', 'X - New Client', 'R - Regular', 'TR - Transfer'];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All Clients' || client.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleViewProfile = (client: Client) => {
    (navigation as any).navigate('StylistClientDetails', { client });
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
        {/* Search Header */}
        <StylistSection isTitle>
          <View style={styles.headerRow}>
            <StylistSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Clients"
            />
          </View>
        </StylistSection>

        {/* Filter Tabs */}
        <StylistSection>
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
        </StylistSection>

        {/* Client List */}
        <StylistSection>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.loadingText}>Loading clients...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people" size={48} color="#EC4899" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Clients' : 'No Clients Yet'}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery 
                  ? `No clients match "${searchQuery}". Try a different search term.`
                  : selectedFilter !== 'All Clients'
                    ? `You don't have any ${selectedFilter.replace('X - ', '').replace('R - ', '').replace('TR - ', '').toLowerCase()}s assigned to you yet.`
                    : 'You haven\'t served any clients yet. New clients will appear here after their first appointment.'}
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
            filteredClients.map((client) => {
              const getVariant = () => {
                if (client.type === 'X - New Client') return 'new-client';
                if (client.type === 'R - Regular') return 'regular';
                if (client.type === 'TR - Transfer') return 'transfer';
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
                          <Ionicons name="time" size={14} color="#666" />
                          <Text style={styles.clientInfoText}>{client.duration}</Text>
                        </View>
                      </View>
                    </View>
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
    <ScreenWrapper title="Clients" userType="stylist" showBackButton={true}>
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search and Filters */}
        <StylistSection style={styles.searchSection}>
          <StylistSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name..."
          />
          
          {/* Filter Tabs with Counts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterTabs}>
              {filterOptions.map((filter) => {
                const count = filter === 'All Clients' ? stats.total :
                             filter === 'X - New Client' ? stats.newClients :
                             filter === 'R - Regular' ? stats.regular :
                             filter === 'TR - Transfer' ? stats.transfer : 0;
                
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
            </View>
          </ScrollView>
        </StylistSection>
          
        {/* Clients List */}
        <StylistSection>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>All Clients</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredClients.length}</Text>
            </View>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.loadingText}>Loading clients...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people" size={48} color="#EC4899" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Clients' : 'No Clients Yet'}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery 
                  ? `No clients match "${searchQuery}". Try a different search term.`
                  : selectedFilter !== 'All Clients'
                    ? `You don't have any ${selectedFilter.replace('X - ', '').replace('R - ', '').replace('TR - ', '').toLowerCase()}s assigned to you yet.`
                    : 'You haven\'t served any clients yet. New clients will appear here after their first appointment.'}
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
            filteredClients.map((client) => {
              const getVariant = () => {
                if (client.type === 'X - New Client') return 'new-client';
                if (client.type === 'R - Regular') return 'regular';
                if (client.type === 'TR - Transfer') return 'transfer';
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
                          <Ionicons name="time" size={14} color="#666" />
                          <Text style={styles.clientInfoText}>{client.duration}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
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
  // Scrollable Client List (responsive to screen height)
  clientListScroll: {
    maxHeight: Dimensions.get('window').height * 0.5, // 50% of screen height
  },
  searchSection: {
    marginTop: 16,
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
  clientService: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  clientInfoRow: {
    gap: 4,
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
});
