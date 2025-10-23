import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../hooks/redux';
import { FONTS } from '../constants';

// Test credentials from the seeded data
const TEST_CREDENTIALS = [
  {
    email: 'client1@test.com',
    password: 'password123',
    role: 'Client',
    description: 'Test Client Account'
  },
  {
    email: 'stylist1@test.com', 
    password: 'password123',
    role: 'Stylist',
    description: 'Test Stylist Account'
  },
  {
    email: 'receptionist1@test.com',
    password: 'password123', 
    role: 'Receptionist',
    description: 'Test Receptionist Account'
  }
];

export default function LoginTestComponent() {
  const { login, isLoading, user, error } = useAuth();
  const [selectedCredential, setSelectedCredential] = useState<number | null>(null);

  const handleTestLogin = async (credential: typeof TEST_CREDENTIALS[0], index: number) => {
    try {
      setSelectedCredential(index);
      clearError();
      
      const result = await login({
        email: credential.email,
        password: credential.password,
        rememberMe: true
      });

      if (result.type === 'auth/login/fulfilled') {
        Alert.alert(
          'Login Successful!', 
          `Welcome ${result.payload.user.firstName} ${result.payload.user.lastName}!\nRole: ${result.payload.user.userType}`
        );
      } else if (result.type === 'auth/login/rejected') {
        Alert.alert('Login Failed', result.payload || 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'Something went wrong');
    } finally {
      setSelectedCredential(null);
    }
  };

  const clearError = () => {
    // This would be implemented in the actual component
    console.log('Clearing error...');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Test Component</Text>
      <Text style={styles.subtitle}>Test Firebase Authentication</Text>
      
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

      <View style={styles.credentialsContainer}>
        <Text style={styles.credentialsTitle}>Test Credentials:</Text>
        {TEST_CREDENTIALS.map((credential, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.credentialButton,
              selectedCredential === index && styles.credentialButtonSelected
            ]}
            onPress={() => handleTestLogin(credential, index)}
            disabled={isLoading}
          >
            <Text style={styles.credentialRole}>{credential.role}</Text>
            <Text style={styles.credentialEmail}>{credential.email}</Text>
            <Text style={styles.credentialDescription}>{credential.description}</Text>
            {selectedCredential === index && isLoading && (
              <Text style={styles.loadingText}>Logging in...</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Instructions:</Text>
        <Text style={styles.infoText}>1. Tap any credential button to test login</Text>
        <Text style={styles.infoText}>2. Check console for detailed logs</Text>
        <Text style={styles.infoText}>3. Verify user data is loaded correctly</Text>
        <Text style={styles.infoText}>4. Test navigation to appropriate dashboard</Text>
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
  credentialsContainer: {
    marginBottom: 30,
  },
  credentialsTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 15,
  },
  credentialButton: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  credentialButtonSelected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#160B53',
  },
  credentialRole: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 4,
  },
  credentialEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#666666',
    marginBottom: 4,
  },
  credentialDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#999999',
  },
  loadingText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#160B53',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#1565C0',
    marginBottom: 4,
  },
});
