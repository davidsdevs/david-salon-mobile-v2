import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../hooks/redux';
import { FONTS } from '../constants';

export default function LogoutTestComponent() {
  const { user, logout, isLoading, error } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const handleTestLogout = async () => {
    try {
      setTestResult('Testing logout...');
      
      const result = await logout();
      
      if (result.type === 'auth/logout/fulfilled') {
        setTestResult('✅ Logout successful! User has been signed out.');
      } else if (result.type === 'auth/logout/rejected') {
        setTestResult(`❌ Logout failed: ${result.payload}`);
      }
    } catch (error: any) {
      setTestResult(`❌ Logout error: ${error.message}`);
    }
  };

  const handleTestLogoutWithConfirmation = () => {
    Alert.alert(
      "Test Logout",
      "This will test the logout functionality with confirmation dialog",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Test Logout",
          style: "destructive",
          onPress: handleTestLogout
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logout Test Component</Text>
      <Text style={styles.subtitle}>Test Firebase Logout Functionality</Text>
      
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userTitle}>Currently Logged In:</Text>
          <Text style={styles.userText}>Name: {user.firstName} {user.lastName}</Text>
          <Text style={styles.userText}>Email: {user.email}</Text>
          <Text style={styles.userText}>Role: {user.userType}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {testResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.testButton, isLoading && styles.testButtonDisabled]}
          onPress={handleTestLogout}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>
            {isLoading ? 'Logging out...' : 'Test Direct Logout'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.confirmationButton, isLoading && styles.testButtonDisabled]}
          onPress={handleTestLogoutWithConfirmation}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>
            Test Logout with Confirmation
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Test Instructions:</Text>
        <Text style={styles.infoText}>1. Tap "Test Direct Logout" to logout immediately</Text>
        <Text style={styles.infoText}>2. Tap "Test Logout with Confirmation" to test the confirmation dialog</Text>
        <Text style={styles.infoText}>3. Check console for detailed logs</Text>
        <Text style={styles.infoText}>4. Verify user is redirected to login screen</Text>
        <Text style={styles.infoText}>5. Verify AsyncStorage is cleared</Text>
      </View>

      <View style={styles.expectedContainer}>
        <Text style={styles.expectedTitle}>Expected Behavior:</Text>
        <Text style={styles.expectedText}>• Firebase Auth signOut() is called</Text>
        <Text style={styles.expectedText}>• AsyncStorage is cleared</Text>
        <Text style={styles.expectedText}>• Redux state is reset</Text>
        <Text style={styles.expectedText}>• User is redirected to login screen</Text>
        <Text style={styles.expectedText}>• No authentication errors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#160B53',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  userInfo: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  userTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#2E7D32',
    marginBottom: 8,
  },
  userText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#2E7D32',
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#C62828',
  },
  resultContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  resultText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#1565C0',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  testButton: {
    backgroundColor: '#160B53',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  confirmationButton: {
    backgroundColor: '#FF4444',
  },
  testButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  infoContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#E65100',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#E65100',
    marginBottom: 4,
  },
  expectedContainer: {
    backgroundColor: '#F3E5F5',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  expectedTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#6A1B9A',
    marginBottom: 8,
  },
  expectedText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6A1B9A',
    marginBottom: 4,
  },
});
