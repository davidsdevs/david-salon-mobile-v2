import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/redux';
import { FONTS } from '../../constants';
import FirebaseAuthService from '../../services/firebaseAuthService';
import ErrorModal from '../../components/ErrorModal';

// Import logo
const logoImage = require('../../../assets/logo.png');

export default function LoginPageScreen() {
  const navigation = useNavigation();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorModal({
        visible: true,
        title: 'Almost there',
        message: 'Please enter your email and password to continue.',
      });
      return;
    }

    try {
      clearError(); // Clear any previous errors
      
      const result = await login({
        email: email.trim(),
        password,
        rememberMe
      });

      if (result.type === 'auth/login/fulfilled') {
        // Login successful - navigation will be handled automatically by Redux state change
        console.log('✅ Login successful, app will redirect automatically');
      } else if (result.type === 'auth/login/rejected') {
        // Gentle, user-friendly messaging (avoid technical terms)
        setErrorModal({
          visible: true,
          title: 'Please check your details',
          message: 'We couldn’t sign you in. Double‑check your email and password, then try again.',
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorModal({
        visible: true,
        title: 'Something went wrong',
        message: 'We couldn’t sign you in right now. Please try again in a moment.',
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorModal({
        visible: true,
        title: 'Email needed',
        message: 'Please enter your email address to reset your password.',
      });
      return;
    }

    try {
      await FirebaseAuthService.resetPassword(email.trim());
      setErrorModal({
        visible: true,
        title: 'Email sent',
        message: 'We’ve sent a reset link to your email address.',
      });
    } catch (error: any) {
      setErrorModal({
        visible: true,
        title: 'Couldn’t send email',
        message: 'We couldn’t send the reset link right now. Please try again shortly.',
      });
    }
  };

  const closeErrorModal = () => {
    setErrorModal({
      visible: false,
      title: '',
      message: '',
    });
  };

  const retryLogin = () => {
    closeErrorModal();
    handleLogin();
  };

  // Mobile-first responsive layout
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={logoImage}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        <Text style={styles.welcomeTitle}>Welcome Back</Text>
        <Text style={styles.welcomeSubtitle}>Sign in to your David's Salon account</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#A0A0A0"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.rememberMeText}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity 
          style={[styles.signInButton, isLoading && styles.signInButtonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => console.log('Register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legal */}
      <Text style={styles.legalText}>
        By signing in, you agree to our{' '}
        <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
        <Text style={styles.legalLink}>Privacy Policy</Text>
      </Text>

      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={closeErrorModal}
        type={errorModal.title === 'Email Sent' ? 'info' : 'error'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 80 : 60,
    // Responsive padding for different screen sizes
    paddingHorizontal: Platform.OS === 'web' ? 24 : 20,
    paddingTop: Platform.OS === 'web' ? 100 : Platform.OS === 'android' ? 80 : 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 150,
    height: 75,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    // Responsive padding for different screen sizes
    padding: Platform.OS === 'web' ? 40 : 30,
    marginHorizontal: Platform.OS === 'web' ? 0 : 0,
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
    alignSelf: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  welcomeTitle: {
    fontSize: Platform.OS === 'android' ? 20 : Platform.OS === 'ios' ? 22 : 24,
    color: '#160B53',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  welcomeSubtitle: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: FONTS.regular,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#160B53',
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    backgroundColor: '#FAFAFA',
    fontFamily: FONTS.regular,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    fontFamily: FONTS.regular,
  },
  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#160B53',
    borderColor: '#160B53',
  },
  rememberMeText: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666666',
    fontFamily: FONTS.regular,
  },
  forgotPasswordText: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  signInButton: {
    backgroundColor: '#160B53',
    paddingVertical: Platform.OS === 'web' ? 15 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 16 : 14,
    fontFamily: FONTS.medium,
  },
  signInButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666666',
    fontFamily: FONTS.regular,
  },
  registerLink: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  legalText: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    fontFamily: FONTS.regular,
  },
      legalLink: {
        color: '#160B53',
        fontFamily: FONTS.semiBold,
      },
    });
