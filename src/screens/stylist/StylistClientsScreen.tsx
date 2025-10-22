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
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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

  // Fetch clients from Firebase
  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📋 Fetching clients for stylist:', user.id);

        // Get all appointments for this stylist
        const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
        const q = query(
          appointmentsRef,
          where('stylistId', '==', user.id)
        );

        const querySnapshot = await getDocs(q);
        const clientMap = new Map();

        // Process each appointment to build client list
        for (const appointmentDoc of querySnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          const clientId = appointmentData['clientId'];

          if (!clientMap.has(clientId)) {
            // Fetch client details
            const clientDoc = await getDoc(doc(db, COLLECTIONS.USERS, clientId));
            if (clientDoc.exists()) {
              const clientData = clientDoc.data();
              
              clientMap.set(clientId, {
                id: clientId,
                name: `${clientData['firstName']} ${clientData['lastName']}`,
                service: 'Various Services',
                duration: '1-3 hours',
                type: 'R - Regular',
                notes: '',
                phone: clientData['phone'] || 'N/A',
                email: clientData['email'] || 'N/A',
                memberSince: clientData['memberSince'] ? new Date(clientData['memberSince'].toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A',
                totalVisits: 0,
                lastVisit: 'N/A',
                totalSpent: '₱0',
                allergies: 'None',
              });
            }
          }
        }

        const clientsList = Array.from(clientMap.values());
        console.log('✅ Fetched clients:', clientsList.length);
        setClients(clientsList);
      } catch (error) {
        console.error('❌ Error fetching clients:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user?.id]);

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
        {/* Client Management Header */}
        <StylistSection isTitle>
          <View style={styles.headerRow}>
            <StylistPageTitle title="Client Management" />
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
          
        {/* Clients List */}
        <StylistSection>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.loadingText}>Loading clients...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No clients found</Text>
              <Text style={styles.emptyMessage}>You don't have any clients yet or no clients match your search.</Text>
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

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Clients" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Page Title */}
        <StylistSection isTitle>
          <StylistPageTitle title="Client Management" />
        </StylistSection>

        {/* Search and Filters */}
        <StylistSection>
          <StylistSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Clients"
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
          
        {/* Clients List */}
        <StylistSection>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.loadingText}>Loading clients...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No clients found</Text>
              <Text style={styles.emptyMessage}>You don't have any clients yet or no clients match your search.</Text>
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
    gap: 8,
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
  emptyTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});
