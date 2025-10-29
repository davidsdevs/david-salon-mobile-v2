import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { useAuth } from '../hooks/redux';
import { FONTS, APP_CONFIG, SCREEN_DIMENSIONS } from '../constants';

interface HeaderProps {
  title: string;
  subtitle?: string | undefined;
  showNotification?: boolean;
  showBackButton?: boolean;
  userType?: 'client' | 'stylist';
}

const isIPhone = Platform.OS === 'ios';

export default function Header({ 
  title, 
  subtitle,
  showNotification = true,
  showBackButton = false,
  userType = 'client'
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen to all notifications
  useEffect(() => {
    if (!user?.uid && !user?.id) return;

    const userId = user.uid || user.id;
    
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    // Show all notifications (both read and unread)
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setUnreadCount(querySnapshot.size);
    });

    return () => unsubscribe();
  }, [user?.uid, user?.id]);

  const handleNotificationPress = () => {
    const notificationRoute = userType === 'stylist' ? 'StylistNotifications' : 'Notifications';
    (navigation as any).navigate(notificationRoute);
  };


  const handleBackPress = () => {
    (navigation as any).goBack();
  };
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={APP_CONFIG.backgroundColor} />
      
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={24} color={APP_CONFIG.primaryColor} />
            </TouchableOpacity>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle || currentDate}</Text>
          </View>
        </View>
        
        {showNotification && (
          <View style={styles.rightSection}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handleNotificationPress}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons name="notifications" size={24} color={APP_CONFIG.primaryColor} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.borderColor,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_DIMENSIONS.padding,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 5,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_CONFIG.primaryColor,
    fontFamily: FONTS.semiBold,
  },
  subtitle: {
    fontSize: 13,
    color: APP_CONFIG.lightTextColor,
    fontFamily: FONTS.regular,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 5,
  },
  notificationButton: {
    padding: 5,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
    lineHeight: 12,
  },
});
