import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { useAuth } from '../../hooks/redux';
import ScreenWrapper from '../../components/ScreenWrapper';
import { APP_CONFIG, FONTS } from '../../constants';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'appointment' | 'client' | 'schedule' | 'general' | 'info' | 'success' | 'warning' | 'error' | 'promotion';
  read: boolean;
  actionRequired?: boolean;
  createdAt?: any;
  isRead?: boolean;
}

export default function StylistNotificationsScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Fetch notifications from Firebase
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔔 Fetching notifications for user:', user.id);

        const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
        const q = query(
          notificationsRef,
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
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

        console.log('✅ Fetched notifications:', fetchedNotifications.length);
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

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
      case 'client':
        return 'people';
      case 'schedule':
        return 'time';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return '#4A90E2';
      case 'client':
        return '#8B5CF6';
      case 'schedule':
        return '#F59E0B';
      default:
        return '#160B53';
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Update in Firebase
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
      await updateDoc(notificationRef, {
        isRead: true,
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true, isRead: true }
            : notification
        )
      );
      console.log('✅ Notification marked as read:', id);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update all unread notifications in Firebase
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notification.id);
        await updateDoc(notificationRef, {
          isRead: true,
        });
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true, isRead: true }))
      );
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#160B53" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <>
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
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptyMessage}>You're all caught up! Check back later for updates.</Text>
              </View>
            ) : (
              notifications.map((notification) => (
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
                  <View style={styles.profileIconContainer}>
                    <Ionicons name="person-circle" size={32} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
        </>
        )}
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Notifications" showBackButton={true} userType="stylist">
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#160B53" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <>
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
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptyMessage}>You're all caught up! Check back later for updates.</Text>
              </View>
            ) : (
              notifications.map((notification) => (
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
                  <View style={styles.profileIconContainer}>
                    <Ionicons name="person-circle" size={32} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
        </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : 16,
    color: '#160B53',
    fontFamily: FONTS.bold,
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
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  actionRequiredText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  profileIconContainer: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});
