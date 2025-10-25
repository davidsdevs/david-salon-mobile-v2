import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants';

interface ClientTypeLegendProps {
  variant?: 'icon' | 'inline' | 'compact';
}

export default function ClientTypeLegend({ variant = 'icon' }: ClientTypeLegendProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Icon-only version (for use in headers)
  if (variant === 'icon') {
    return (
      <>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          style={styles.iconButton}
          accessibilityLabel="Client type information"
          accessibilityHint="Tap to learn about client types"
        >
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="people" size={28} color="#160B53" />
                <Text style={styles.modalTitle}>Client Types</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.legendList}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <Text style={[styles.legendBadgeText, { color: '#92400E' }]}>X</Text>
                  </View>
                  <View style={styles.legendText}>
                    <Text style={styles.legendLabel}>New Client</Text>
                    <Text style={styles.legendDescription}>First-time visitor to the salon</Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendBadge, { backgroundColor: '#FCE7F3', borderColor: '#FBCFE8' }]}>
                    <Text style={[styles.legendBadgeText, { color: '#9F1239' }]}>R</Text>
                  </View>
                  <View style={styles.legendText}>
                    <Text style={styles.legendLabel}>Regular Client</Text>
                    <Text style={styles.legendDescription}>Returning client with a preferred stylist</Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendBadge, { backgroundColor: '#CCFBF1', borderColor: '#99F6E4' }]}>
                    <Text style={[styles.legendBadgeText, { color: '#115E59' }]}>TR</Text>
                  </View>
                  <View style={styles.legendText}>
                    <Text style={styles.legendLabel}>Transfer Client</Text>
                    <Text style={styles.legendDescription}>Client without a preferred stylist, can be assigned to anyone</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Text style={styles.footerNote}>💡 Client types help with scheduling and service personalization</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // Compact inline version (for use in tight spaces)
  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactText}>
          <Text style={styles.compactBadge}>X</Text>=New  
          <Text style={styles.compactBadge}>R</Text>=Regular  
          <Text style={styles.compactBadge}>TR</Text>=Transfer
        </Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.compactIcon}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="people" size={28} color="#160B53" />
                <Text style={styles.modalTitle}>Client Types</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.legendList}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <Text style={[styles.legendBadgeText, { color: '#92400E' }]}>X</Text>
                  </View>
                  <View style={styles.legendText}>
                    <Text style={styles.legendLabel}>New Client</Text>
                    <Text style={styles.legendDescription}>First-time visitor to the salon</Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendBadge, { backgroundColor: '#FCE7F3', borderColor: '#FBCFE8' }]}>
                    <Text style={[styles.legendBadgeText, { color: '#9F1239' }]}>R</Text>
                  </View>
                  <View style={styles.legendText}>
                    <Text style={styles.legendLabel}>Regular Client</Text>
                    <Text style={styles.legendDescription}>Returning client with a preferred stylist</Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendBadge, { backgroundColor: '#CCFBF1', borderColor: '#99F6E4' }]}>
                    <Text style={[styles.legendBadgeText, { color: '#115E59' }]}>TR</Text>
                  </View>
                  <View style={styles.legendText}>
                    <Text style={styles.legendLabel}>Transfer Client</Text>
                    <Text style={styles.legendDescription}>Client without a preferred stylist, can be assigned to anyone</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Text style={styles.footerNote}>💡 Client types help with scheduling and service personalization</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // Full inline version (for use in empty states or help sections)
  return (
    <View style={styles.inlineContainer}>
      <View style={styles.inlineHeader}>
        <Ionicons name="information-circle" size={20} color="#160B53" />
        <Text style={styles.inlineTitle}>Client Types Guide</Text>
      </View>
      <View style={styles.inlineLegend}>
        <View style={styles.inlineItem}>
          <View style={[styles.inlineBadge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.inlineBadgeText}>X</Text>
          </View>
          <Text style={styles.inlineLabel}>New Client</Text>
        </View>
        <View style={styles.inlineItem}>
          <View style={[styles.inlineBadge, { backgroundColor: '#FCE7F3' }]}>
            <Text style={styles.inlineBadgeText}>R</Text>
          </View>
          <Text style={styles.inlineLabel}>Regular</Text>
        </View>
        <View style={styles.inlineItem}>
          <View style={[styles.inlineBadge, { backgroundColor: '#CCFBF1' }]}>
            <Text style={styles.inlineBadgeText}>TR</Text>
          </View>
          <Text style={styles.inlineLabel}>Transfer</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Icon variant styles
  iconButton: {
    padding: 4,
    marginLeft: 6,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#160B53',
    flex: 1,
    marginLeft: 12,
  },
  legendList: {
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  legendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendBadgeText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 4,
  },
  legendDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    lineHeight: 18,
  },
  modalFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerNote: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Compact variant styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  compactText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  compactBadge: {
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginHorizontal: 2,
  },
  compactIcon: {
    padding: 2,
  },

  // Inline variant styles
  inlineContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inlineTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
  },
  inlineLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  inlineItem: {
    alignItems: 'center',
    gap: 6,
  },
  inlineBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineBadgeText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  inlineLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
});

