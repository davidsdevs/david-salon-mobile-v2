import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { useAuth } from '../../hooks/redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenWrapper from '../../components/ScreenWrapper';
import { StylistSection } from '../../components/stylist';
import { FONTS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';

export default function StylistEditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Update Firebase
      await updateDoc(doc(db, COLLECTIONS.USERS, user.id), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      // Fetch updated user data from Firebase
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.id));
      if (userDoc.exists()) {
        const updatedUserData = userDoc.data();
        
        // Create updated user object
        const updatedUser = {
          ...user,
          firstName: updatedUserData.firstName,
          lastName: updatedUserData.lastName,
          phone: updatedUserData.phone,
        };
        
        // Update Redux store with fresh data
        updateUserProfile(updatedUser);
        
        // Also save to AsyncStorage so it persists
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        console.log('✅ Profile updated in Firebase, Redux, and AsyncStorage');
      }

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper title="Edit Profile" showBackButton userType="stylist">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <StylistSection>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Enter first name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Enter last name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Read-only)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.email}
                editable={false}
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>
          </View>
        </StylistSection>

        <StylistSection>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h4,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.label,
    color: '#374151',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 4,
    fontSize: TYPOGRAPHY.body,
    color: '#160B53',
    fontFamily: FONTS.regular,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  helperText: {
    fontSize: TYPOGRAPHY.caption,
    color: '#9CA3AF',
    fontFamily: FONTS.regular,
    marginTop: SPACING.xs,
  },
  saveButton: {
    backgroundColor: '#160B53',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.body,
    fontFamily: FONTS.semiBold,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: TYPOGRAPHY.body,
    fontFamily: FONTS.semiBold,
  },
});
