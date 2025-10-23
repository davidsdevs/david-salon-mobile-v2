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
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import ScreenWrapper from '../../components/ScreenWrapper';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import { APP_CONFIG, FONTS } from '../../constants';
import { useBooking } from '../../context/BookingContext';

const { width } = Dimensions.get('window');

export default function BranchSelectionScreen() {
  const navigation = useNavigation();
  const { state, setBranch, setLoading, setError } = useBooking();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(state.bookingData.branchId || null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoadingLocal] = useState(true);
  const [error, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const formatTime = (time: string) => {
    if (!time || typeof time !== 'string') return 'N/A';
    
    try {
      const [hourStr, minuteStr] = time.split(':');
      const hour = parseInt(hourStr || '0', 10);
      const minute = parseInt(minuteStr || '0', 10);
      const suffix = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  };

  const getReadableHours = (operatingHours: any) => {
    if (!operatingHours) return 'No hours available';
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday'];
    const openDays = days.filter(day => operatingHours[day]?.['isOpen']);
    if (openDays.length === 0) return 'Closed';
    const sampleDay = operatingHours[openDays[0] as string];
    return `Mon–Sat: ${formatTime(sampleDay['open'])} – ${formatTime(sampleDay['close'])}`;
  };

  const loadBranches = async () => {
    try {
      setLoading(true);
      setLoadingLocal(true);
      setError(null);
      setErrorLocal(null);

      // Query only active branches
      const branchesRef = collection(db, COLLECTIONS.BRANCHES);
      const q = query(branchesRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const activeBranches: any[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        activeBranches.push({
          id: doc.id,
          branchId: doc.id,
          name: data['name'],
          address: data['address'],
          city: data['city'],
          phone: data['contactNumber'],
          email: data['email'],
          hours: getReadableHours(data['operatingHours']),
          operatingHours: data['operatingHours'],
          isActive: data['isActive'],
        });
      });

      setBranches(activeBranches);
    } catch (err) {
      console.error('Error loading branches:', err);
      const errorMsg = 'Failed to load branches. Please try again.';
      setError(errorMsg);
      setErrorLocal(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
      setLoadingLocal(false);
    }
  };

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
  };

  const handleNext = () => {
    if (selectedBranch) {
      const selectedBranchData = branches.find(branch => branch.branchId === selectedBranch);
      if (selectedBranchData) {
        // Save branch data to booking context
        setBranch({
          branchId: selectedBranchData.branchId,
          branchName: selectedBranchData.name,
          branchAddress: selectedBranchData.address,
          branchCity: selectedBranchData.city,
        });
        
        // Navigate to next step
        (navigation as any).navigate('DateTimeSelection');
      }
    } else {
      Alert.alert('Selection Required', 'Please select a branch to continue.');
    }
  };

  // ✅ Web layout
  if (Platform.OS === 'web') {
    return (
      <ResponsiveLayout currentScreen="Booking">
        <View style={styles.webContainer}>
          {/* Progress Indicator */}
          <ProgressIndicator />

          {/* Branch Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Branch</Text>
            <Text style={styles.sectionSubtitle}>Choose your preferred salon location</Text>

            <View style={styles.branchesContainer}>
              {(loading || state.isLoading) ? (
                <LoadingState />
              ) : (error || state.error) ? (
                <ErrorState error={error || state.error} onRetry={loadBranches} />
              ) : (
                branches.map(branch => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    selected={selectedBranch === branch.id}
                    onSelect={handleBranchSelect}
                  />
                ))
              )}
            </View>
          </View>

          {/* Navigation Buttons */}
          <NavigationButtons
            onBack={() => navigation.goBack()}
            onNext={handleNext}
            disabled={!selectedBranch}
          />
        </View>
      </ResponsiveLayout>
    );
  }

  // ✅ Mobile layout
  return (
    <ScreenWrapper title="Book Appointment">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ProgressIndicator />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Branch</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred salon location</Text>

          <View style={styles.branchesContainer}>
            {(loading || state.isLoading) ? (
              <LoadingState />
            ) : (error || state.error) ? (
              <ErrorState error={error || state.error} onRetry={loadBranches} />
            ) : (
              branches.map(branch => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  selected={selectedBranch === branch.id}
                  onSelect={handleBranchSelect}
                />
              ))
            )}
          </View>
        </View>

        <NavigationButtons
          onBack={() => navigation.goBack()}
          onNext={handleNext}
          disabled={!selectedBranch}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

// ✅ Subcomponents
const ProgressIndicator = () => (
  <View style={styles.progressContainer}>
    {['Select Branch', 'Date & Time', 'Services & Stylist', 'Summary'].map((label, index) => (
      <React.Fragment key={index}>
        <View style={styles.progressStep}>
          <View style={[styles.stepCircle, index === 0 && styles.activeStep]}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>
          <Text style={styles.stepLabel}>{label}</Text>
        </View>
        {index < 3 && <View style={styles.progressLine} />}
      </React.Fragment>
    ))}
  </View>
);

const BranchCard = ({ branch, selected, onSelect }: any) => (
  <TouchableOpacity
    style={[styles.branchCard, selected && styles.selectedBranchCard]}
    onPress={() => onSelect(branch.id)}
  >
    <View style={styles.branchHeader}>
      <View style={styles.branchInfo}>
        <Text style={styles.branchName}>{branch.name}</Text>
        <Text style={styles.branchAddress}>{branch.address}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={24} color={APP_CONFIG.primaryColor} />}
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
);

const LoadingState = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
    <Text style={styles.loadingText}>Loading branches...</Text>
  </View>
);

const ErrorState = ({ error, onRetry }: any) => (
  <View style={styles.errorContainer}>
    <Ionicons name="alert-circle" size={48} color="#EF4444" />
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

const NavigationButtons = ({ onBack, onNext, disabled }: any) => (
  <View style={styles.navigationContainer}>
    <TouchableOpacity style={styles.previousButton} onPress={onBack}>
      <Ionicons name="arrow-back" size={20} color="#666" />
      <Text style={styles.previousButtonText}>Previous</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.nextButton, disabled && styles.disabledButton]}
      onPress={onNext}
      disabled={disabled}
    >
      <Text style={styles.nextButtonText}>Next</Text>
      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
