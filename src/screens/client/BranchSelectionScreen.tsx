import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import { APP_CONFIG, FONTS } from '../../constants';
import MobileAppointmentService, { Branch } from '../../services/mobileAppointmentService';

const { width } = Dimensions.get('window');

export default function BranchSelectionScreen() {
  const navigation = useNavigation();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const branchesData = await MobileAppointmentService.getBranches();
      setBranches(branchesData);
    } catch (err) {
      console.error('Error loading branches:', err);
      setError('Failed to load branches. Please try again.');
      Alert.alert('Error', 'Failed to load branches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
  };

  const handleNext = () => {
    if (selectedBranch) {
      (navigation as any).navigate('DateTimeSelection', { branchId: selectedBranch });
    }
  };

  // For web, render with ResponsiveLayout to include sidebar
  if (Platform.OS === 'web') {
    return (
      <ResponsiveLayout currentScreen="Booking">
        <View style={styles.webContainer}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Select Branch</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Date & Time</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Services & Stylist</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
        </View>

        {/* Branch Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Branch</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred salon location</Text>
          
          <View style={styles.branchesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
                <Text style={styles.loadingText}>Loading branches...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadBranches}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              branches.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.branchCard,
                  selectedBranch === branch.id && styles.selectedBranchCard,
                  !branch.isActive && styles.unavailableBranchCard
                ]}
                  onPress={() => branch.isActive && handleBranchSelect(branch.id)}
                  disabled={!branch.isActive}
              >
                <View style={styles.branchHeader}>
                  <View style={styles.branchInfo}>
                    <Text style={[
                      styles.branchName,
                      !branch.isActive && styles.unavailableText
                    ]}>
                      {branch.name}
                    </Text>
                    <Text style={[
                      styles.branchAddress,
                      !branch.isActive && styles.unavailableText
                    ]}>
                      {branch.address}
                    </Text>
                  </View>
                  <View style={styles.branchStatus}>
                    {selectedBranch === branch.id && (
                      <Ionicons name="checkmark-circle" size={24} color={APP_CONFIG.primaryColor} />
                    )}
                    {!branch.isActive && (
                      <Text style={styles.unavailableLabel}>Unavailable</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.branchDetails}>
                  <View style={styles.branchDetailItem}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.branchDetailText}>{branch.phone}</Text>
                  </View>
                  <View style={styles.branchDetailItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.branchDetailText}>{branch.hours}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={styles.previousButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              !selectedBranch && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!selectedBranch}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        </View>
      </ResponsiveLayout>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Book Appointment">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Select Branch</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Date & Time</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Services & Stylist</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
        </View>

        {/* Branch Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Branch</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred salon location</Text>
          
          <View style={styles.branchesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
                <Text style={styles.loadingText}>Loading branches...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadBranches}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              branches.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.branchCard,
                  selectedBranch === branch.id && styles.selectedBranchCard,
                  !branch.isActive && styles.unavailableBranchCard
                ]}
                  onPress={() => branch.isActive && handleBranchSelect(branch.id)}
                  disabled={!branch.isActive}
              >
                <View style={styles.branchHeader}>
                  <View style={styles.branchInfo}>
                    <Text style={[
                      styles.branchName,
                      !branch.isActive && styles.unavailableText
                    ]}>
                      {branch.name}
                    </Text>
                    <Text style={[
                      styles.branchAddress,
                      !branch.isActive && styles.unavailableText
                    ]}>
                      {branch.address}
                    </Text>
                  </View>
                  <View style={styles.branchStatus}>
                    {selectedBranch === branch.id && (
                      <Ionicons name="checkmark-circle" size={24} color={APP_CONFIG.primaryColor} />
                    )}
                    {!branch.isActive && (
                      <Text style={styles.unavailableLabel}>Unavailable</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.branchDetails}>
                  <View style={styles.branchDetailItem}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.branchDetailText}>{branch.phone}</Text>
                  </View>
                  <View style={styles.branchDetailItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.branchDetailText}>{branch.hours}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={styles.previousButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              !selectedBranch && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!selectedBranch}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 30 : 20,
    flexWrap: 'wrap',
    minHeight: Platform.OS === 'android' ? 60 : 70,
  },
  progressStep: {
    alignItems: 'center',
    minWidth: Platform.OS === 'android' ? 50 : 55,
    justifyContent: 'center',
  },
  stepCircle: {
    width: Platform.OS === 'web' ? 40 : Platform.OS === 'ios' ? 32 : 36,
    height: Platform.OS === 'web' ? 40 : Platform.OS === 'ios' ? 32 : 36,
    borderRadius: Platform.OS === 'web' ? 20 : Platform.OS === 'ios' ? 16 : 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  activeStep: {
    backgroundColor: APP_CONFIG.primaryColor,
  },
  stepNumber: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 12 : 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: Platform.OS === 'web' ? 12 : Platform.OS === 'android' ? 9 : 9,
    fontFamily: FONTS.medium,
    color: '#666',
    textAlign: 'center',
    maxWidth: Platform.OS === 'android' ? 50 : 55,
    marginTop: 2,
  },
  progressLine: {
    width: Platform.OS === 'web' ? 60 : Platform.OS === 'android' ? 30 : 35,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: Platform.OS === 'web' ? 8 : Platform.OS === 'android' ? 2 : 3,
    marginTop: Platform.OS === 'web' ? -20 : Platform.OS === 'android' ? -16 : -14,
    alignSelf: 'center',
  },
  section: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : 18,
    color: Platform.OS === 'web' ? '#160B53' : '#160B53',
    fontFamily: Platform.OS === 'web' ? 'Poppins_700Bold' : FONTS.bold,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    fontFamily: FONTS.regular,
    marginBottom: 24,
  },
  branchesContainer: {
    gap: 16,
  },
  branchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 18 : 20,
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBranchCard: {
    borderColor: APP_CONFIG.primaryColor,
  },
  unavailableBranchCard: {
    opacity: 0.6,
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 17 : 18,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    fontFamily: FONTS.regular,
    color: '#666',
  },
  unavailableText: {
    color: '#999',
  },
  branchStatus: {
    alignItems: 'center',
  },
  unavailableLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#999',
  },
  branchDetails: {
    gap: 8,
  },
  branchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchDetailText: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    fontFamily: FONTS.regular,
    color: '#666',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingVertical: Platform.OS === 'web' ? 20 : 16,
    gap: Platform.OS === 'web' ? 0 : 12,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  previousButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: APP_CONFIG.primaryColor,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
