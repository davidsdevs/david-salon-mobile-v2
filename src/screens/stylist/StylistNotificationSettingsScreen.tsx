import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenWrapper from '../../components/ScreenWrapper';
import { StylistSection } from '../../components/stylist';
import { APP_CONFIG, FONTS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

interface NotificationSettings {
  appointmentReminders: boolean;
  newAppointments: boolean;
  appointmentChanges: boolean;
  appointmentCancellations: boolean;
  promotions: boolean;
  systemUpdates: boolean;
}

export default function StylistNotificationSettingsScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);

  // Notification preferences state
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [newAppointments, setNewAppointments] = useState(true);
  const [appointmentChanges, setAppointmentChanges] = useState(true);
  const [appointmentCancellations, setAppointmentCancellations] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [systemUpdates, setSystemUpdates] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (savedSettings) {
        const settings: NotificationSettings = JSON.parse(savedSettings);
        setAppointmentReminders(settings.appointmentReminders);
        setNewAppointments(settings.newAppointments);
        setAppointmentChanges(settings.appointmentChanges);
        setAppointmentCancellations(settings.appointmentCancellations);
        setPromotions(settings.promotions);
        setSystemUpdates(settings.systemUpdates);
        console.log('✅ Loaded notification settings:', settings);
      }
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      console.log('✅ Saved notification settings:', settings);
    } catch (error) {
      console.error('❌ Error saving notification settings:', error);
    }
  };

  // Helper to update a setting and save
  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings: NotificationSettings = {
      appointmentReminders,
      newAppointments,
      appointmentChanges,
      appointmentCancellations,
      promotions,
      systemUpdates,
      [key]: value,
    };
    saveSettings(newSettings);
  };

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const NotificationOption = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange,
    iconColor = APP_CONFIG.primaryColor 
  }: {
    icon: string;
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    iconColor?: string;
  }) => (
    <View style={styles.optionRow}>
      <View style={styles.optionLeft}>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: `${APP_CONFIG.primaryColor}50` }}
        thumbColor={value ? APP_CONFIG.primaryColor : '#F3F4F6'}
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper title="Notification Settings" showBackButton userType="stylist">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Notification Settings" showBackButton userType="stylist">
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <StylistSection>
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons name="notifications" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Manage Your Notifications</Text>
            <Text style={styles.headerDescription}>
              Choose which notifications you want to receive to stay updated on your appointments and clients.
            </Text>
          </View>
        </StylistSection>

        {/* Appointment Notifications */}
        <StylistSection>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appointments</Text>
          </View>
          <View style={styles.optionsCard}>
            <NotificationOption
              icon="alarm-outline"
              title="Appointment Reminders"
              description="Get reminded before your upcoming appointments"
              value={appointmentReminders}
              onValueChange={(value) => { setAppointmentReminders(value); updateSetting('appointmentReminders', value); }}
              iconColor="#6366F1"
            />
            <NotificationOption
              icon="calendar-outline"
              title="New Appointments"
              description="Notify when you receive new appointment bookings"
              value={newAppointments}
              onValueChange={(value) => { setNewAppointments(value); updateSetting('newAppointments', value); }}
              iconColor="#10B981"
            />
            <NotificationOption
              icon="create-outline"
              title="Appointment Changes"
              description="Alert when appointments are rescheduled"
              value={appointmentChanges}
              onValueChange={(value) => { setAppointmentChanges(value); updateSetting('appointmentChanges', value); }}
              iconColor="#F59E0B"
            />
            <NotificationOption
              icon="close-circle-outline"
              title="Cancellations"
              description="Notify when appointments are cancelled"
              value={appointmentCancellations}
              onValueChange={(value) => { setAppointmentCancellations(value); updateSetting('appointmentCancellations', value); }}
              iconColor="#EF4444"
            />
          </View>
        </StylistSection>

        {/* General Notifications */}
        <StylistSection>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>General</Text>
          </View>
          <View style={styles.optionsCard}>
            <NotificationOption
              icon="pricetag-outline"
              title="Promotions & Tips"
              description="Receive tips and promotional offers"
              value={promotions}
              onValueChange={(value) => { setPromotions(value); updateSetting('promotions', value); }}
              iconColor="#EC4899"
            />
            <NotificationOption
              icon="information-circle-outline"
              title="System Updates"
              description="Important app updates and announcements"
              value={systemUpdates}
              onValueChange={(value) => { setSystemUpdates(value); updateSetting('systemUpdates', value); }}
              iconColor="#06B6D4"
            />
          </View>
        </StylistSection>

        {/* Info Note */}
        <StylistSection>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              You can change these settings anytime. Some critical notifications cannot be disabled for service quality.
            </Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.body,
    color: '#6B7280',
    fontFamily: FONTS.medium,
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: APP_CONFIG.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: FONTS.bold,
    color: '#160B53',
  },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.caption,
    fontFamily: FONTS.regular,
    color: '#4B5563',
    lineHeight: 20,
  },
});
