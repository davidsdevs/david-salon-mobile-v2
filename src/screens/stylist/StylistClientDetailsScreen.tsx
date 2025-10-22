import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistBadge,
} from '../../components/stylist';
import { FONTS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';

type ClientDetailsRouteProp = RouteProp<
  { ClientDetails: { client: any } },
  'ClientDetails'
>;

export default function StylistClientDetailsScreen() {
  const route = useRoute<ClientDetailsRouteProp>();
  const client = route.params?.client;
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  if (!client) {
    return (
      <ScreenWrapper title="Client Details" showBackButton userType="stylist">
        <View style={styles.container}>
          <Text style={styles.errorText}>Client not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Client Profile" showBackButton userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Client Header Card */}
        <StylistSection>
          <View style={styles.headerCard}>
            <View style={styles.clientHeader}>
              <View style={styles.clientAvatar}>
                <View style={styles.avatarGradient}>
                  <Ionicons name="person" size={56} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{client.name}</Text>
                <StylistBadge
                  label={client.type}
                  variant={
                    client.type === 'X - New Client' ? 'new-client' :
                    client.type === 'R - Regular' ? 'regular' :
                    client.type === 'TR - Transfer' ? 'transfer' : 'default'
                  }
                  size="small"
                />
                <View style={styles.memberRow}>
                  <Ionicons name="calendar" size={14} color="#6B7280" />
                  <Text style={styles.memberSince}>Member since {client.memberSince}</Text>
                </View>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Contact Information */}
        <StylistSection>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={20} color="#160B53" />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{client.phone}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>{client.email}</Text>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Visit History */}
        <StylistSection>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color="#160B53" />
              <Text style={styles.sectionTitle}>Visit History</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={24} color="#160B53" />
                </View>
                <Text style={styles.statNumber}>{client.totalVisits}</Text>
                <Text style={styles.statLabel}>Total Visits</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="cash" size={24} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>{client.totalSpent}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Last Visit</Text>
                <Text style={styles.detailValue}>{client.lastVisit}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="cut-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Last Service</Text>
                <Text style={styles.detailValue}>{client.service}</Text>
              </View>
            </View>
          </View>
        </StylistSection>

        {/* Service Preferences */}
        <StylistSection>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cut" size={20} color="#160B53" />
              <Text style={styles.sectionTitle}>Service Preferences</Text>
            </View>
            {client.colorFormula && (
              <View style={styles.detailRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="color-palette-outline" size={18} color="#160B53" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Color Formula</Text>
                  <Text style={styles.detailValue}>{client.colorFormula}</Text>
                </View>
              </View>
            )}
            {client.allergies && (
              <View style={[styles.detailRow, client.allergies !== 'None' && styles.alertRow]}>
                <View style={[styles.iconCircle, client.allergies !== 'None' && styles.alertIconCircle]}>
                  <Ionicons name="warning-outline" size={18} color={client.allergies !== 'None' ? '#EF4444' : '#160B53'} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Allergies</Text>
                  <Text style={[styles.detailValue, client.allergies !== 'None' && styles.alertText]}>
                    {client.allergies}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={18} color="#160B53" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Stylist Notes</Text>
                <Text style={styles.detailValue}>{client.notes}</Text>
              </View>
            </View>
          </View>
        </StylistSection>
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
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clientAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#160B53',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#160B53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
    gap: 8,
  },
  clientName: {
    fontSize: TYPOGRAPHY.h3,
    color: '#160B53',
    fontFamily: FONTS.bold,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberSince: {
    fontSize: TYPOGRAPHY.label,
    color: '#6B7280',
    fontFamily: FONTS.regular,
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
    marginBottom: 10,
    paddingBottom: 6,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.label,
    color: '#9CA3AF',
    fontFamily: FONTS.medium,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.h4,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: '#6B7280',
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  alertRow: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  alertIconCircle: {
    backgroundColor: '#FEE2E2',
  },
  alertText: {
    color: '#EF4444',
    fontFamily: FONTS.semiBold,
  },
});
