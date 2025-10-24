import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../hooks/redux';
import { APP_CONFIG, FONTS } from '../../constants';

const { width } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'appointment' | 'promotion' | 'reward' | 'general';
  read: boolean;
  isRead: boolean;
  createdAt?: any;
  actionRequired?: boolean;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from Firebase with real-time updates
  useEffect(() => {
    if (!user?.id && !user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = user.uid || user.id;
    console.log('🔔 Setting up real-time listener for client notifications:', userId);

    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        console.log('🔄 Real-time notification update received:', querySnapshot.size);
        const fetchedNotifications: Notification[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data['createdAt']?.toDate();
          const timeAgo = createdAt ? getTimeAgo(createdAt) : 'Recently';

          fetchedNotifications.push({
            id: doc.id,
            title: data['title'] || 'Notification',
            message: data['message'] || '',
            time: timeAgo,
            type: data['type'] || 'general',
            read: data['isRead'] || false,
            isRead: data['isRead'] || false,
            createdAt: data['createdAt'],
          });
        });

        // Sort manually by createdAt
        fetchedNotifications.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA; // Descending order (newest first)
        });

        console.log('✅ Real-time notifications updated:', fetchedNotifications.length);
        setNotifications(fetchedNotifications);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error processing notification update:', error);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time notification listener error:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔌 Unsubscribing from notifications listener');
      unsubscribe();
    };
  }, [user?.uid, user?.id]);

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'calendar';
      case 'promotion':
        return 'pricetag';
      case 'reward':
        return 'gift';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return '#4A90E2';
      case 'promotion':
        return '#FF6B35';
      case 'reward':
        return '#8B5CF6';
      default:
        return '#160B53';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Notifications Header */}
        <View style={styles.section}>
          <View style={styles.headerContainer}>
            <Text style={styles.pageTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.pageSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </Text>
        </View>

        {/* Notifications List */}
        <View style={styles.section}>
          <View style={styles.notificationsContainer}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadNotification
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View style={styles.notificationLeft}>
                  <View style={[
                    styles.notificationIcon,
                    { backgroundColor: getNotificationColor(notification.type) + '20' }
                  ]}>
                    <Ionicons 
                      name={getNotificationIcon(notification.type) as any} 
                      size={20} 
                      color={getNotificationColor(notification.type)} 
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.read && styles.unreadText
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {notification.time}
                    </Text>
                    {notification.actionRequired && (
                      <View style={styles.actionRequiredBadge}>
                        <Text style={styles.actionRequiredText}>Action Required</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Notifications" showBackButton={true}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Notifications Header */}
        <View style={styles.section}>
          <View style={styles.headerContainer}>
            <Text style={styles.pageTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.pageSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </Text>
        </View>

        {/* Notifications List */}
        <View style={styles.section}>
          <View style={styles.notificationsContainer}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadNotification
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View style={styles.notificationLeft}>
                  <View style={[
                    styles.notificationIcon,
                    { backgroundColor: getNotificationColor(notification.type) + '20' }
                  ]}>
                    <Ionicons 
                      name={getNotificationIcon(notification.type) as any} 
                      size={20} 
                      color={getNotificationColor(notification.type)} 
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.read && styles.unreadText
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {notification.time}
                    </Text>
                    {notification.actionRequired && (
                      <View style={styles.actionRequiredBadge}>
                        <Text style={styles.actionRequiredText}>Action Required</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  section: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: Platform.OS === 'web' ? 24 : 20,
    paddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 30 : 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : Platform.OS === 'android' ? 16 : 20,
    color: Platform.OS === 'web' ? '#160B53' : '#160B53',
    fontFamily: Platform.OS === 'web' ? 'Poppins_700Bold' : FONTS.bold,
  },
  pageSubtitle: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    fontFamily: FONTS.regular,
  },
  markAllButton: {
    backgroundColor: '#160B53',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
    borderRadius: 6,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 12 : 10,
    fontFamily: FONTS.semiBold,
  },
  notificationsContainer: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 14 : 16,
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#160B53',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  unreadText: {
    fontFamily: FONTS.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#160B53',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  notificationTime: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    color: '#999',
    fontFamily: FONTS.regular,
  },
  actionRequiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  actionRequiredText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' ? 8 : Platform.OS === 'ios' ? 9 : 10,
    fontFamily: FONTS.semiBold,
  },
});
