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
  StylistFilterTab,
  StylistCard,
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
    console.log('🔄 Setting up real-time subscription for earnings:', stylistId);

    // Fetch completed appointments (services)
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const appointmentsQuery = query(
      appointmentsRef,
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(appointmentsQuery, async (querySnapshot) => {
      try {
        console.log('📡 Real-time earnings update received:', querySnapshot.size, 'transactions');
        const fetchedTransactions: Transaction[] = [];

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
            
            // Calculate total price from serviceStylistPairs
            let totalAmount = 0;
            if (data['serviceStylistPairs'] && data['serviceStylistPairs'].length > 0) {
              totalAmount = data['serviceStylistPairs'].reduce(
                (sum: number, pair: any) => sum + (pair.servicePrice || 0), 
                0
              );
            } else {
              totalAmount = data['price'] || data['finalPrice'] || 0;
            }

            // Get service description
            let serviceDescription = 'Service';
            if (data['serviceStylistPairs'] && data['serviceStylistPairs'].length > 0) {
              serviceDescription = data['serviceStylistPairs'].length === 1
                ? data['serviceStylistPairs'][0].serviceName
                : `${data['serviceStylistPairs'].length} Services`;
            }

            // Calculate commission (example: 60% of service price goes to stylist)
            const commission = totalAmount * 0.6;

            fetchedTransactions.push({
              id: doc.id,
              type: 'service',
              clientName: data['clientName'] || 
                         `${data['clientFirstName'] || ''} ${data['clientLastName'] || ''}`.trim() ||
                         'Unknown Client',
              description: serviceDescription,
              amount: totalAmount,
              commission: commission,
              date: appointmentDate,
              time: appointmentTime,
              status: 'completed',
            });
          }
        });

        // TODO: Add product sales transactions when implemented
        // For now, we'll just have service transactions

        // Sort by date and time (newest first)
        fetchedTransactions.sort((a, b) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return b.time.localeCompare(a.time);
        });

        console.log('✅ Real-time earnings updated:', fetchedTransactions.length);
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

  // Filter transactions for display
  const getFilteredTransactions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedView === 'daily') {
      return transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        txnDate.setHours(0, 0, 0, 0);
        return txnDate.getTime() === today.getTime();
      });
    } else if (selectedView === 'weekly') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= weekStart && txnDate <= weekEnd;
      });
    } else if (selectedView === 'monthly') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      return transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });
    }

    return transactions;
  };

  const filteredTransactions = getFilteredTransactions();

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
        {/* Header */}
        <StylistSection>
          <StylistPageTitle title="My Earnings" />
          <Text style={styles.subtitle}>Track your service revenue and product commissions</Text>
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
            filteredTransactions.map((transaction) => (
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
