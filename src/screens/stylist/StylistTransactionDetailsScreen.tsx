import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/redux';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistBadge,
} from '../../components/stylist';
import { FONTS, TYPOGRAPHY, SPACING, RADIUS, APP_CONFIG } from '../../constants';

type TransactionDetailsRouteProp = RouteProp<
  { TransactionDetails: { client: any } },
  'TransactionDetails'
>;

interface TransactionData {
  id: string;
  branchId: string;
  clientId: string;
  clientInfo: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: any;
  createdBy: string;
  discount: number;
  notes: string;
  paymentMethod: string;
  products: Array<{
    price: number;
    productId: string;
    productName: string;
    quantity: number;
    total: number;
  }>;
  services: Array<{
    adjustedPrice: number;
    adjustmentReason: string;
    basePrice: number;
    clientType: string;
    priceAdjustment: number;
    serviceId: string;
    serviceName: string;
    stylistId: string;
    stylistName: string;
    total: number;
  }>;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  transactionType: string;
  updatedAt: any;
}

export default function StylistTransactionDetailsScreen() {
  const route = useRoute<TransactionDetailsRouteProp>();
  const client = route.params?.client;
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch full transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!client?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const transactionRef = doc(db, 'transactions', client.id);
        const transactionSnap = await getDoc(transactionRef);

        if (transactionSnap.exists()) {
          const data = transactionSnap.data();
          setTransaction({
            id: transactionSnap.id,
            ...data,
          } as TransactionData);
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [client?.id]);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  if (!client) {
    return (
      <ScreenWrapper title="Service Details" showBackButton userType="stylist">
        <View style={styles.container}>
          <Text style={styles.errorText}>Transaction not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (loading) {
    return (
      <ScreenWrapper title="Service Details" showBackButton userType="stylist">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#160B53" />
          <Text style={styles.loadingText}>Loading transaction details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!transaction) {
    return (
      <ScreenWrapper title="Service Details" showBackButton userType="stylist">
        <View style={styles.container}>
          <Text style={styles.errorText}>Transaction data not available</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Get the stylist's service from the transaction
  const stylistId = user?.uid || user?.id;
  const stylistService = transaction.services.find(s => s.stylistId === stylistId);
  const otherServices = transaction.services.filter(s => s.stylistId !== stylistId);

  // Format date
  const transactionDate = transaction.createdAt?.toDate
    ? new Date(transaction.createdAt.toDate()).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  // Get client type label
  const getClientTypeLabel = (type: string) => {
    if (type === 'X') return 'X - New Client';
    if (type === 'R') return 'R - Regular';
    if (type === 'TR') return 'TR - Transfer';
    return type;
  };

  const getClientTypeVariant = (type: string) => {
    if (type === 'X') return 'new-client';
    if (type === 'R') return 'regular';
    if (type === 'TR') return 'transfer';
    return 'default';
  };

  return (
    <ScreenWrapper title="Service Details" showBackButton userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Transaction Header */}
        <StylistSection>
          <View style={styles.headerCard}>
            <View style={styles.transactionHeader}>
              <View style={styles.transactionIcon}>
                <Ionicons name="receipt" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionId}>Transaction #{transaction.id.slice(0, 8)}</Text>
                <Text style={styles.transactionDate}>{transactionDate}</Text>
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusBadge,
                    transaction.status === 'completed' && styles.statusCompleted,
                    transaction.status === 'pending' && styles.statusPending,
                  ]}>
                    <Text style={styles.statusText}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Client Information */}
        <StylistSection>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color="#160B53" />
              <Text style={styles.sectionTitle}>Client Information</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{transaction.clientInfo.name}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{transaction.clientInfo.phone}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{transaction.clientInfo.email}</Text>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Service Details */}
        {stylistService && (
          <StylistSection>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cut" size={20} color="#160B53" />
                <Text style={styles.sectionTitle}>Your Service</Text>
              </View>
              <View style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{stylistService.serviceName}</Text>
                  <StylistBadge
                    label={getClientTypeLabel(stylistService.clientType)}
                    variant={getClientTypeVariant(stylistService.clientType)}
                    size="small"
                  />
                </View>
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Base Price</Text>
                    <Text style={styles.priceValue}>₱{stylistService.basePrice.toFixed(2)}</Text>
                  </View>
                  {stylistService.priceAdjustment !== 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Adjustment</Text>
                      <Text style={[styles.priceValue, stylistService.priceAdjustment > 0 ? styles.pricePositive : styles.priceNegative]}>
                        {stylistService.priceAdjustment > 0 ? '+' : ''}₱{stylistService.priceAdjustment.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {stylistService.adjustmentReason && (
                    <View style={styles.adjustmentReason}>
                      <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                      <Text style={styles.adjustmentReasonText}>{stylistService.adjustmentReason}</Text>
                    </View>
                  )}
                  <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Service Total</Text>
                    <Text style={styles.totalValue}>₱{stylistService.total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </StylistSection>
        )}

        {/* Other Services in Transaction */}
        {otherServices.length > 0 && (
          <StylistSection>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={20} color="#160B53" />
                <Text style={styles.sectionTitle}>Other Services</Text>
              </View>
              {otherServices.map((service, index) => (
                <View key={index} style={styles.otherServiceCard}>
                  <View style={styles.otherServiceHeader}>
                    <Text style={styles.otherServiceName}>{service.serviceName}</Text>
                    <Text style={styles.otherServicePrice}>₱{service.total.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.otherServiceStylist}>by {service.stylistName}</Text>
                </View>
              ))}
            </View>
          </StylistSection>
        )}

        {/* Products (if any) */}
        {transaction.products && transaction.products.length > 0 && (
          <StylistSection>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cube" size={20} color="#160B53" />
                <Text style={styles.sectionTitle}>Products</Text>
              </View>
              {transaction.products.map((product, index) => (
                <View key={index} style={styles.productCard}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.productName}</Text>
                    <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
                  </View>
                  <Text style={styles.productPrice}>₱{product.total.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </StylistSection>
        )}

        {/* Transaction Summary */}
        <StylistSection>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calculator" size={20} color="#160B53" />
              <Text style={styles.sectionTitle}>Transaction Summary</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₱{transaction.subtotal.toFixed(2)}</Text>
            </View>
            {transaction.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>-₱{transaction.discount.toFixed(2)}</Text>
              </View>
            )}
            {transaction.tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>₱{transaction.tax.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalSummaryRow]}>
              <Text style={styles.totalSummaryLabel}>Total</Text>
              <Text style={styles.totalSummaryValue}>₱{transaction.total.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentMethodRow}>
              <Ionicons name="card-outline" size={16} color="#6B7280" />
              <Text style={styles.paymentMethodText}>
                Paid via {transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1)}
              </Text>
            </View>
          </View>
        </StylistSection>

        {/* Notes */}
        {transaction.notes && transaction.notes.trim() !== '' && (
          <StylistSection>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color="#160B53" />
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
              <Text style={styles.notesText}>{transaction.notes}</Text>
            </View>
          </StylistSection>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: SPACING.md,
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
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontFamily: FONTS.regular,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  transactionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#160B53',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#160B53',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  transactionId: {
    fontSize: TYPOGRAPHY.h4,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  transactionDate: {
    fontSize: TYPOGRAPHY.body,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  statusRow: {
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.label,
    color: '#160B53',
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: '#9CA3AF',
    fontFamily: FONTS.medium,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  serviceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.h4,
    color: '#160B53',
    fontFamily: FONTS.bold,
    flex: 1,
  },
  priceBreakdown: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.body,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  pricePositive: {
    color: '#10B981',
  },
  priceNegative: {
    color: '#EF4444',
  },
  adjustmentReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  adjustmentReasonText: {
    fontSize: TYPOGRAPHY.caption,
    color: '#6B7280',
    fontFamily: FONTS.regular,
    flex: 1,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.h4,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: TYPOGRAPHY.caption,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.body,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  discountValue: {
    color: '#10B981',
  },
  totalSummaryRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalSummaryLabel: {
    fontSize: TYPOGRAPHY.h4,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  totalSummaryValue: {
    fontSize: TYPOGRAPHY.h3,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.body,
    color: '#6B7280',
    fontFamily: FONTS.medium,
  },
  notesText: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  otherServiceCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  otherServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  otherServiceName: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  otherServicePrice: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  otherServiceStylist: {
    fontSize: TYPOGRAPHY.caption,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
});
