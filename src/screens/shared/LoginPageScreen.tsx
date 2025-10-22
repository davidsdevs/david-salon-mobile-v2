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

// Import logo
const logoImage = require('../../../assets/logo.png');

export default function LoginPageScreen() {
  const navigation = useNavigation();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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
        // Login failed
        Alert.alert('Login Failed', result.payload || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      await FirebaseAuthService.resetPassword(email.trim());
      Alert.alert(
        'Password Reset Sent', 
        'A password reset link has been sent to your email address.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send password reset email');
    }
  };

  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    // ✅ Web layout
    return (
      <View style={styles.webContainer}>
        <View style={styles.webFormWrapper}>
          <View style={styles.webHeader}>
            <Text style={styles.webWelcomeTitle}>Welcome Back</Text>
            <Text style={styles.webWelcomeSubtitle}>
              Sign in to your David's Salon account
            </Text>
          </View>

          <View style={styles.webFormContainer}>
            <View style={styles.webForm}>

              {/* Email Input */}
              <View style={styles.webInputGroup}>
                <Text style={styles.webInputLabel}>Email Address</Text>
                <TextInput
                  style={styles.webInput}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.webInputGroup}>
                <Text style={styles.webInputLabel}>Password</Text>
                <View style={styles.webPasswordContainer}>
                  <TextInput
                    style={styles.webPasswordInput}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.webEyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.webOptionsContainer}>
                <View style={styles.webRememberMeContainer}>
                  <TouchableOpacity
                    style={styles.webCheckboxContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.webCheckbox, rememberMe && styles.webCheckboxChecked]}>
                      {rememberMe && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.webRememberMeText}>Remember me</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.webForgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity 
                style={[styles.webSignInButton, isLoading && styles.webSignInButtonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.webSignInButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ✅ Mobile layout
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 80 : 60,
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
      // Web-specific styles matching salon-management-system exactly
      webContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        paddingTop: 122, // Account for header height
      },
      webFormWrapper: {
        maxWidth: 400,
        width: '100%',
      },
      webHeader: {
        alignItems: 'center',
        marginBottom: 32,
      },
      webWelcomeTitle: {
        fontSize: 36,
        fontFamily: FONTS.bold,
        color: '#160B53',
        marginBottom: 8,
        textAlign: 'center',
      },
      webWelcomeSubtitle: {
        fontSize: 16,
        fontFamily: FONTS.regular,
        color: '#6B7280',
        textAlign: 'center',
      },
      webFormContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 32,
        borderWidth: 1,
        borderColor: '#DBDBDB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 8,
      },
      webForm: {
        gap: 24,
      },
      webInputGroup: {
        marginBottom: 0,
      },
      webInputLabel: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: '#374151',
        marginBottom: 8,
      },
      webInput: {
        width: '100%',
        height: 36, // h-9 (matches button default size)
        paddingHorizontal: 12, // px-3
        paddingVertical: 4, // py-1
        borderWidth: 1,
        borderColor: '#D1D5DB', // border-input
        borderRadius: 6, // rounded-md
        fontSize: 16, // text-base
        fontFamily: FONTS.regular,
        backgroundColor: '#FFFFFF',
      },
      webPasswordContainer: {
        position: 'relative',
        width: '100%',
      },
      webPasswordInput: {
        width: '100%',
        height: 36, // h-9 (matches button default size)
        paddingHorizontal: 12, // px-3
        paddingVertical: 4, // py-1
        paddingRight: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB', // border-input
        borderRadius: 6, // rounded-md
        fontSize: 16, // text-base
        fontFamily: FONTS.regular,
        backgroundColor: '#FFFFFF',
      },
      webEyeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
      },
      webOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      webRememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      webCheckboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      webCheckbox: {
        width: 16,
        height: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 4,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
      },
      webCheckboxChecked: {
        backgroundColor: '#160B53',
        borderColor: '#160B53',
      },
      webRememberMeText: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: '#374151',
      },
      webForgotPasswordText: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: '#160B53',
      },
      webSignInButton: {
        width: '100%',
        height: 36, // h-9 (default button size)
        backgroundColor: '#160B53',
        paddingVertical: 8, // py-2
        paddingHorizontal: 16, // px-4
        borderRadius: 6, // rounded-md
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      webSignInButtonText: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: '#FFFFFF',
      },
      webSignInButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
      },
    });
