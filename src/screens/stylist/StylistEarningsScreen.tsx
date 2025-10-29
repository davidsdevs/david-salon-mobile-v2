import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
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
  transactionId: string;
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
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'time-desc' | 'time-asc' | 'amount-desc' | 'amount-asc' | 'type'>('date-desc');
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, startDate, endDate]);
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

    // Fetch from transactions collection - only paid transactions
    const transactionsRef = collection(db, 'transactions');
    const paidTransactionsQuery = query(transactionsRef, where('status', '==', 'paid'));

    const unsubscribe = onSnapshot(paidTransactionsQuery, async (querySnapshot) => {
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
                const serviceTotal = Number(service.adjustedPrice) || 0;
                const commission = Number((serviceTotal * 0.6).toFixed(2));

                console.log('✅ Adding service to earnings:', {
                  clientName: data['clientInfo']?.name,
                  serviceName: service.serviceName,
                  amount: serviceTotal,
                  commission: commission,
                  date: transactionDate
                });

                fetchedTransactions.push({
                  id: doc.id + '_' + service.serviceId, // Unique ID for each service
                  transactionId: doc.id, // Original transaction ID for navigation
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
                const productTotal = Number((Number(product.price) || 0) * (Number(product.quantity) || 1));
                const commission = Number((productTotal * 0.1).toFixed(2));

                fetchedTransactions.push({
                  id: doc.id + '_' + (product.id || product.productId),
                  transactionId: doc.id, // Original transaction ID for navigation
                  type: 'product',
                  clientName: data['clientInfo']?.name || 'Unknown Client',
                  description: `${product.name || product.productName} (x${product.quantity})`,
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

  // Calculate summary from all transactions
  useEffect(() => {
    // Calculate summary
    const serviceRevenue = transactions
      .filter(txn => txn.type === 'service')
      .reduce((sum, txn) => sum + txn.commission, 0);

    const productCommission = transactions
      .filter(txn => txn.type === 'product')
      .reduce((sum, txn) => sum + txn.commission, 0);

    setSummary({
      serviceRevenue,
      productCommission,
      totalEarnings: serviceRevenue + productCommission,
      transactionCount: transactions.length,
    });
  }, [transactions]);

  // Filter and sort transactions for display
  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(txn => 
        txn.clientName.toLowerCase().includes(query) ||
        txn.description.toLowerCase().includes(query) ||
        txn.type.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(txn => {
        const transactionDate = new Date(txn.date);
        transactionDate.setHours(0, 0, 0, 0);
        
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return transactionDate >= start && transactionDate <= end;
        } else if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          return transactionDate >= start;
        } else if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return transactionDate <= end;
        }
        return true;
      });
    }

    // Sort transactions
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'time-desc':
          return new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
        case 'time-asc':
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
    <ScreenWrapper title="My Earnings" userType="stylist" showBackButton={true}>
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

        {/* Search and Sort */}
        <StylistSection>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="cut" size={24} color="#4A90E2" />
              </View>
              <Text style={styles.summaryLabel}>Service Revenue</Text>
              <Text style={styles.summaryAmount}>₱{(Number(summary.serviceRevenue) || 0).toFixed(2)}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cart" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.summaryLabel}>Product Commission</Text>
              <Text style={styles.summaryAmount}>₱{(Number(summary.productCommission) || 0).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <Ionicons name="wallet" size={28} color="#FFFFFF" />
              <Text style={styles.totalLabel}>Total Earnings</Text>
            </View>
            <Text style={styles.totalAmount}>₱{(Number(summary.totalEarnings) || 0).toFixed(2)}</Text>
            <Text style={styles.totalSubtext}>{Number(summary.transactionCount) || 0} transactions</Text>
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
                Your earnings will appear here after completing appointments. Keep up the great work!
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
              <TouchableOpacity 
                key={transaction.id} 
                style={styles.transactionCard}
                activeOpacity={0.7}
                onPress={() => (navigation as any).navigate('StylistTransactionDetails', { 
                  client: { id: transaction.transactionId } 
                })}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    transaction.type === 'service' 
                      ? styles.serviceIcon 
                      : styles.productIcon
                  ]}>
                    <Ionicons 
                      name={transaction.type === 'service' ? 'cut' : 'cart'} 
                      size={24} 
                      color={transaction.type === 'service' ? '#4A90E2' : '#F59E0B'} 
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
                  <Text style={styles.transactionAmount}>₱{(Number(transaction.amount) || 0).toFixed(2)}</Text>
                  <Text style={styles.commissionAmount}>
                    Your share: ₱{(Number(transaction.commission) || 0).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIcon: {
    backgroundColor: '#E3F2FD',
  },
  productIcon: {
    backgroundColor: '#FEF3C7',
  },
  transactionDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    fontFamily: FONTS.regular,
    color: '#666',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  transactionDate: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    fontFamily: FONTS.regular,
    color: '#666',
    marginLeft: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  commissionAmount: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
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
