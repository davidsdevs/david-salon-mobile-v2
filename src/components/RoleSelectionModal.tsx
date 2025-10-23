import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants';

// Import logo
const logoImage = require('../../assets/logo.png');

interface RoleSelectionModalProps {
  visible: boolean;
  onSelectRole: (role: 'client' | 'stylist') => void;
  userRoles: string[];
}

export default function RoleSelectionModal({ 
  visible, 
  onSelectRole, 
  userRoles 
}: RoleSelectionModalProps) {
  const isWeb = Platform.OS === 'web';

  const handleRoleSelection = (role: 'client' | 'stylist') => {
    onSelectRole(role);
  };

  if (isWeb) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => {}} // Prevent closing by back button
      >
        <View style={styles.webOverlay}>
          <View style={styles.webModalContainer}>
            <View style={styles.webHeader}>
              <Image
                source={logoImage}
                style={styles.webLogo}
                resizeMode="contain"
              />
              <Text style={styles.webTitle}>Choose Your Role</Text>
              <Text style={styles.webSubtitle}>
                You have access to multiple roles. Please select which one you'd like to use.
              </Text>
            </View>

            <View style={styles.webRoleContainer}>
              {userRoles.includes('client') && (
                <TouchableOpacity
                  style={styles.webRoleButton}
                  onPress={() => handleRoleSelection('client')}
                >
                  <View style={styles.webRoleIcon}>
                    <Ionicons name="person" size={32} color="#160B53" />
                  </View>
                  <Text style={styles.webRoleTitle}>Client</Text>
                  <Text style={styles.webRoleDescription}>
                    Book appointments and manage your salon experience
                  </Text>
                </TouchableOpacity>
              )}

              {userRoles.includes('stylist') && (
                <TouchableOpacity
                  style={styles.webRoleButton}
                  onPress={() => handleRoleSelection('stylist')}
                >
                  <View style={styles.webRoleIcon}>
                    <Ionicons name="cut" size={32} color="#160B53" />
                  </View>
                  <Text style={styles.webRoleTitle}>Stylist</Text>
                  <Text style={styles.webRoleDescription}>
                    Manage your schedule and client appointments
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Mobile layout
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}} // Prevent closing by back button
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Image
              source={logoImage}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Choose Your Role</Text>
            <Text style={styles.subtitle}>
              You have access to multiple roles. Please select which one you'd like to use.
            </Text>
          </View>

          <View style={styles.roleContainer}>
            {userRoles.includes('client') && (
              <TouchableOpacity
                style={styles.roleButton}
                onPress={() => handleRoleSelection('client')}
              >
                <View style={styles.roleIcon}>
                  <Ionicons name="person" size={28} color="#160B53" />
                </View>
                <Text style={styles.roleTitle}>Client</Text>
                <Text style={styles.roleDescription}>
                  Book appointments and manage your salon experience
                </Text>
              </TouchableOpacity>
            )}

            {userRoles.includes('stylist') && (
              <TouchableOpacity
                style={styles.roleButton}
                onPress={() => handleRoleSelection('stylist')}
              >
                <View style={styles.roleIcon}>
                  <Ionicons name="cut" size={28} color="#160B53" />
                </View>
                <Text style={styles.roleTitle}>Stylist</Text>
                <Text style={styles.roleDescription}>
                  Manage your schedule and client appointments
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Mobile styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#160B53',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  roleContainer: {
    gap: 16,
  },
  roleButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Web styles
  webOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  webModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  webHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  webLogo: {
    width: 150,
    height: 75,
    marginBottom: 24,
  },
  webTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#160B53',
    textAlign: 'center',
    marginBottom: 12,
  },
  webSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  webRoleContainer: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  webRoleButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    flex: 1,
    minWidth: 200,
  },
  webRoleIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  webRoleTitle: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 12,
  },
  webRoleDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
