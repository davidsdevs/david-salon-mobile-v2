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
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { useAuth } from '../../hooks/redux';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistSearchBar,
  StylistFilterTab,
  StylistCard,
  StylistPagination,
} from '../../components/stylist';
import { APP_CONFIG, FONTS } from '../../constants';

interface Transaction {
  id: string;
  type: 'service' | 'product';
  clientName: string;
  description: string;
  amount: number;
  commission: number;
  date: string;
  time: string;
  status: 'completed' | 'pending';
}

interface EarningsSummary {
  serviceRevenue: number;
  productCommission: number;
  totalEarnings: number;
  transactionCount: number;
}

export default function StylistEarningsScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'type'>('date-desc');
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset to page 1 when view, search, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedView, searchQuery, sortBy]);
  const [summary, setSummary] = useState<EarningsSummary>({
    serviceRevenue: 0,
    productCommission: 0,
    totalEarnings: 0,
    transactionCount: 0,
  });

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Fetch transactions with real-time updates
  useEffect(() => {
    if (!user?.uid && !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const stylistId = user.uid || user.id;
    console.log('🔄 Setting up real-time subscription for earnings:', {
      stylistId,
      userUid: user.uid,
      userId: user.id,
      fullUser: user
    });

    // Fetch from transactions collection
    const transactionsRef = collection(db, 'transactions');

    const unsubscribe = onSnapshot(transactionsRef, async (querySnapshot) => {
      try {
        console.log('📡 Real-time earnings update received:', querySnapshot.size, 'total transactions');
        const fetchedTransactions: Transaction[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Check if this transaction has services for this stylist
          if (data['services'] && Array.isArray(data['services'])) {
            data['services'].forEach((service: any) => {
              console.log('🔍 Checking service:', {
                transactionId: doc.id,
                serviceStylistId: service.stylistId,
                currentStylistId: stylistId,
                matches: service.stylistId === stylistId
              });
              
              if (service.stylistId === stylistId) {
                // Format date and time
                const transactionDate = data['createdAt']?.toDate
                  ? data['createdAt'].toDate().toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0];
                
                const transactionTime = data['createdAt']?.toDate
                  ? data['createdAt'].toDate().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : '';

                // Calculate commission (60% of service total)
                const serviceTotal = service.total || service.adjustedPrice || 0;
                const commission = serviceTotal * 0.6;

                console.log('✅ Adding service to earnings:', {
                  clientName: data['clientInfo']?.name,
                  serviceName: service.serviceName,
                  amount: serviceTotal,
                  commission: commission,
                  date: transactionDate
                });

                fetchedTransactions.push({
                  id: doc.id + '_' + service.serviceId, // Unique ID for each service
                  type: 'service',
                  clientName: data['clientInfo']?.name || 'Unknown Client',
                  description: service.serviceName || 'Service',
                  amount: serviceTotal,
                  commission: commission,
                  date: transactionDate,
                  time: transactionTime,
                  status: data['status'] === 'completed' ? 'completed' : 'pending',
                });
              }
            });
          }

          // Add product commissions if stylist sold products
          if (data['products'] && Array.isArray(data['products']) && data['products'].length > 0) {
            // Check if this transaction has services by this stylist (they get product commission)
            const hasStylistService = data['services']?.some((s: any) => s.stylistId === stylistId);
            
            if (hasStylistService) {
              data['products'].forEach((product: any) => {
                const transactionDate = data['createdAt']?.toDate
                  ? data['createdAt'].toDate().toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0];
                
                const transactionTime = data['createdAt']?.toDate
                  ? data['createdAt'].toDate().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : '';

                // Product commission (10% of product total)
                const productTotal = product.total || 0;
                const commission = productTotal * 0.1;

                fetchedTransactions.push({
                  id: doc.id + '_' + product.productId,
                  type: 'product',
                  clientName: data['clientInfo']?.name || 'Unknown Client',
                  description: `${product.productName} (x${product.quantity})`,
                  amount: productTotal,
                  commission: commission,
                  date: transactionDate,
                  time: transactionTime,
                  status: data['status'] === 'completed' ? 'completed' : 'pending',
                });
              });
            }
          }
        });

        // Sort by date and time (newest first)
        fetchedTransactions.sort((a, b) => {
          const dateCompare = new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
          return dateCompare;
        });

        console.log('✅ Real-time earnings updated:', {
          totalTransactions: fetchedTransactions.length,
          transactions: fetchedTransactions.map(t => ({
            id: t.id,
            client: t.clientName,
            description: t.description,
            amount: t.amount,
            date: t.date
          }))
        });
        setTransactions(fetchedTransactions);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error processing earnings update:', error);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time earnings listener error:', error);
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up earnings subscription');
      unsubscribe();
    };
  }, [user?.uid, user?.id]);

  // Filter transactions and calculate summary based on selected view
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = transactions;

    if (selectedView === 'daily') {
      filtered = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        txnDate.setHours(0, 0, 0, 0);
        return txnDate.getTime() === today.getTime();
      });
    } else if (selectedView === 'weekly') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      filtered = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= weekStart && txnDate <= weekEnd;
      });
    } else if (selectedView === 'monthly') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      filtered = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });
    }

    // Calculate summary
    const serviceRevenue = filtered
      .filter(txn => txn.type === 'service')
      .reduce((sum, txn) => sum + txn.commission, 0);

    const productCommission = filtered
      .filter(txn => txn.type === 'product')
      .reduce((sum, txn) => sum + txn.commission, 0);

    setSummary({
      serviceRevenue,
      productCommission,
      totalEarnings: serviceRevenue + productCommission,
      transactionCount: filtered.length,
    });
  }, [transactions, selectedView]);

  // Filter and sort transactions for display
  const getFilteredTransactions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = transactions;

    // Filter by time period
    if (selectedView === 'daily') {
      filtered = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        txnDate.setHours(0, 0, 0, 0);
        return txnDate.getTime() === today.getTime();
      });
    } else if (selectedView === 'weekly') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      filtered = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= weekStart && txnDate <= weekEnd;
      });
    } else if (selectedView === 'monthly') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      filtered = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(txn => 
        txn.clientName.toLowerCase().includes(query) ||
        txn.description.toLowerCase().includes(query) ||
        txn.type.toLowerCase().includes(query)
      );
    }

    // Sort transactions
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
        case 'date-asc':
          return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
        case 'amount-desc':
          return b.commission - a.commission;
        case 'amount-asc':
          return a.commission - b.commission;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <ScreenWrapper title="My Earnings" userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search and Sort */}
        <StylistSection>
          <View style={styles.searchSortRow}>
            <View style={styles.searchBarContainer}>
              <StylistSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search transactions..."
              />
            </View>
            <View style={styles.sortButtons}>
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
                      style={[styles.sortDropdownItem, sortBy === 'date-desc' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('date-desc');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="calendar-outline" 
                        size={18} 
                        color={sortBy === 'date-desc' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'date-desc' && styles.sortDropdownTextActive]}>
                        Date (Newest First)
                      </Text>
                      {sortBy === 'date-desc' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'date-asc' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('date-asc');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="calendar-outline" 
                        size={18} 
                        color={sortBy === 'date-asc' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'date-asc' && styles.sortDropdownTextActive]}>
                        Date (Oldest First)
                      </Text>
                      {sortBy === 'date-asc' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'amount-desc' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('amount-desc');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="cash-outline" 
                        size={18} 
                        color={sortBy === 'amount-desc' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'amount-desc' && styles.sortDropdownTextActive]}>
                        Amount (High to Low)
                      </Text>
                      {sortBy === 'amount-desc' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'amount-asc' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('amount-asc');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="cash-outline" 
                        size={18} 
                        color={sortBy === 'amount-asc' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'amount-asc' && styles.sortDropdownTextActive]}>
                        Amount (Low to High)
                      </Text>
                      {sortBy === 'amount-asc' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sortDropdownItem, sortBy === 'type' && styles.sortDropdownItemActive]}
                      onPress={() => {
                        setSortBy('type');
                        setSortDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="pricetag-outline" 
                        size={18} 
                        color={sortBy === 'type' ? '#160B53' : '#6B7280'} 
                      />
                      <Text style={[styles.sortDropdownText, sortBy === 'type' && styles.sortDropdownTextActive]}>
                        Type
                      </Text>
                      {sortBy === 'type' && (
                        <Ionicons name="checkmark" size={18} color="#160B53" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </StylistSection>

        {/* View Filter Tabs */}
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

        {/* Summary Cards */}
        <StylistSection>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="cut" size={24} color="#4A90E2" />
              </View>
              <Text style={styles.summaryLabel}>Service Revenue</Text>
              <Text style={styles.summaryAmount}>₱{summary.serviceRevenue.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cart" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.summaryLabel}>Product Commission</Text>
              <Text style={styles.summaryAmount}>₱{summary.productCommission.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <Ionicons name="wallet" size={28} color="#FFFFFF" />
              <Text style={styles.totalLabel}>Total Earnings</Text>
            </View>
            <Text style={styles.totalAmount}>₱{summary.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.totalSubtext}>{summary.transactionCount} transactions</Text>
          </View>
        </StylistSection>

        {/* Transactions List */}
        <StylistSection>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#160B53" />
              <Text style={styles.emptyStateText}>Loading earnings...</Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="wallet" size={48} color="#10B981" />
              </View>
              <Text style={styles.emptyStateTitle}>No Earnings Yet</Text>
              <Text style={styles.emptyStateText}>
                {selectedView === 'daily' 
                  ? 'No completed services today. Keep up the great work!'
                  : selectedView === 'weekly'
                    ? 'No completed services this week. Your earnings will appear here after completing appointments.'
                    : 'No completed services this month. Complete appointments to start earning!'}
              </Text>
              <View style={styles.emptyStateHint}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.emptyStateHintText}>
                  Earnings are calculated after appointments are marked as completed
                </Text>
              </View>
            </View>
          ) : (
            <>
            {paginatedTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    transaction.type === 'service' 
                      ? styles.serviceIcon 
                      : styles.productIcon
                  ]}>
                    <Ionicons 
                      name={transaction.type === 'service' ? 'cut' : 'cart'} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.clientName}>{transaction.clientName}</Text>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <View style={styles.transactionMeta}>
                      <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)} • {transaction.time}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>₱{transaction.amount.toFixed(2)}</Text>
                  <Text style={styles.commissionAmount}>
                    Your share: ₱{transaction.commission.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            <StylistPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTransactions.length}
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
  filterSection: {
    marginTop: 0,
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  totalCard: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#111827',
    marginBottom: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  transactionLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIcon: {
    backgroundColor: '#4A90E2',
  },
  productIcon: {
    backgroundColor: '#F59E0B',
  },
  transactionDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#111827',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#111827',
    marginBottom: 2,
  },
  commissionAmount: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#10B981',
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
});
