import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, limit, orderBy, Timestamp, writeBatch, deleteDoc, addDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { useAuth } from '../../hooks/redux';
import { scheduleLocalNotification } from '../../services/pushNotifications';
import { sendManualPushNotification } from '../../utils/sendManualPushNotification';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  StylistSection,
  StylistPageTitle,
  StylistBadge,
  StylistPagination,
} from '../../components/stylist';
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
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isDeleting, setIsDeleting] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [])
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Fetch notifications from Firebase with real-time updates
  useEffect(() => {
    if (!user?.id && !user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = user.uid || user.id;
    console.log('🔔 Setting up real-time listener for notifications:', userId, '(uid:', user.uid, 'id:', user.id, ')');

    // Limit to last 60 days and max 100 notifications
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoTimestamp = Timestamp.fromDate(sixtyDaysAgo);

    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      where('createdAt', '>=', sixtyDaysAgoTimestamp),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    // Set up real-time listener with debouncing
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        console.log('🔄 Real-time notification update received:', querySnapshot.size);
        
        // Debounce updates to prevent rapid re-renders
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
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

          // Already sorted by orderBy in query
          console.log('✅ Real-time notifications updated:', fetchedNotifications.length);
          setNotifications(fetchedNotifications);
          setLoading(false);
        }, 300); // 300ms debounce
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
      // Update all unread notifications in Firebase using batch
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notification.id);
        batch.update(notificationRef, { isRead: true });
      });
      
      await batch.commit();
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const clearReadNotifications = async () => {
    Alert.alert(
      'Clear Read Notifications',
      'Are you sure you want to delete all read notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const readNotifications = notifications.filter(n => n.read);
              
              if (readNotifications.length === 0) {
                Alert.alert('No Read Notifications', 'There are no read notifications to delete.');
                setIsDeleting(false);
                return;
              }

              // Batch delete read notifications
              const batch = writeBatch(db);
              readNotifications.forEach(notification => {
                const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notification.id);
                batch.delete(notificationRef);
              });
              
              await batch.commit();
              console.log('✅ Deleted', readNotifications.length, 'read notifications');
              Alert.alert('Success', `Deleted ${readNotifications.length} read notification${readNotifications.length !== 1 ? 's' : ''}`);
              setIsDeleting(false);
            } catch (error) {
              console.error('❌ Error deleting read notifications:', error);
              Alert.alert('Error', 'Failed to delete notifications. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Test push notification functions
  const testLocalNotification = () => {
    scheduleLocalNotification(
      'Test Notification',
      'This is a local test notification! It will appear in 5 seconds.',
      5
    );
    Alert.alert('Success', 'Test notification scheduled! Wait 5 seconds...');
  };

  const testFirestoreNotification = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      // Create notification in Firestore
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        recipientId: user.id,
        title: 'Test from Firestore',
        message: 'This notification was created in Firestore with manual push!',
        type: 'general',
        isRead: false,
        createdAt: Timestamp.now(),
      });

      // Manually send push notification
      await sendManualPushNotification(
        user.id,
        'Test from Firestore',
        'This notification was created in Firestore with manual push!',
        { type: 'test', screen: 'Notifications' }
      );

      Alert.alert('Success', 'Notification created and push sent! Check your notification.');
    } catch (error) {
      console.error('Error creating test notification:', error);
      Alert.alert('Error', 'Failed to create notification');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  // Group notifications by type
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    read: readCount,
    appointment: notifications.filter(n => n.type === 'appointment').length,
    client: notifications.filter(n => n.type === 'client').length,
    schedule: notifications.filter(n => n.type === 'schedule').length,
  };

  // Memoize filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (selectedFilter === 'unread') return !n.read;
      if (selectedFilter === 'read') return n.read;
      return true; // 'all'
    });
  }, [notifications, selectedFilter]);

  // Memoize pagination
  const { totalPages, startIndex, endIndex, paginatedNotifications } = useMemo(() => {
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, paginatedNotifications };
  }, [filteredNotifications, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Memoize grouped notifications
  const { groupedNotifications, sortedGroups } = useMemo(() => {
    const groupedNotifications = paginatedNotifications.reduce((groups: any, notification) => {
      const date = notification.createdAt?.toDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey = 'Older';
      if (date) {
        const notifDate = new Date(date);
        notifDate.setHours(0, 0, 0, 0);
        
        if (notifDate.getTime() === today.getTime()) {
          groupKey = 'Today';
        } else if (notifDate.getTime() === yesterday.getTime()) {
          groupKey = 'Yesterday';
        } else if (notifDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
          groupKey = 'This Week';
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
      return groups;
    }, {});

    const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];
    const sortedGroups = groupOrder.filter(key => groupedNotifications[key]);
    
    return { groupedNotifications, sortedGroups };
  }, [paginatedNotifications]);

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
            <Text style={styles.pageTitle}>My Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.pageSubtitle}>
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
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

  // Render notification item for FlatList
  const renderNotificationItem = useCallback(({ item: notification }: { item: Notification }) => (
    <TouchableOpacity
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
  ), []);

  // Render group header for FlatList
  const renderGroupHeader = useCallback((groupKey: string) => (
    <Text style={styles.groupTitle}>{groupKey}</Text>
  ), []);

  // Flatten grouped notifications for FlatList
  const flatListData = useMemo(() => {
    const data: Array<{ type: 'header' | 'item', groupKey?: string, notification?: Notification }> = [];
    sortedGroups.forEach(groupKey => {
      data.push({ type: 'header', groupKey });
      groupedNotifications[groupKey].forEach((notification: Notification) => {
        data.push({ type: 'item', notification });
      });
    });
    return data;
  }, [sortedGroups, groupedNotifications]);

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Notifications" showBackButton={true} userType="stylist">
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#160B53" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <>
        {/* Filter Tabs */}
        <StylistSection>
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterTabs}>
                <TouchableOpacity
                  style={[
                    styles.quickFilterChip,
                    selectedFilter === 'all' && styles.quickFilterChipActive
                  ]}
                  onPress={() => setSelectedFilter('all')}
                >
                  <Text style={[
                    styles.quickFilterText,
                    selectedFilter === 'all' && styles.quickFilterTextActive
                  ]}>
                    All
                  </Text>
                  {stats.total > 0 && (
                    <View style={[
                      styles.quickFilterBadge,
                      selectedFilter === 'all' && styles.quickFilterBadgeActive
                    ]}>
                      <Text style={[
                        styles.quickFilterBadgeText,
                        selectedFilter === 'all' && styles.quickFilterBadgeTextActive
                      ]}>
                        {stats.total}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickFilterChip,
                    selectedFilter === 'unread' && styles.quickFilterChipActive
                  ]}
                  onPress={() => setSelectedFilter('unread')}
                >
                  <Text style={[
                    styles.quickFilterText,
                    selectedFilter === 'unread' && styles.quickFilterTextActive
                  ]}>
                    Unread
                  </Text>
                  {stats.unread > 0 && (
                    <View style={[
                      styles.quickFilterBadge,
                      selectedFilter === 'unread' && styles.quickFilterBadgeActive
                    ]}>
                      <Text style={[
                        styles.quickFilterBadgeText,
                        selectedFilter === 'unread' && styles.quickFilterBadgeTextActive
                      ]}>
                        {stats.unread}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickFilterChip,
                    selectedFilter === 'read' && styles.quickFilterChipActive
                  ]}
                  onPress={() => setSelectedFilter('read')}
                >
                  <Text style={[
                    styles.quickFilterText,
                    selectedFilter === 'read' && styles.quickFilterTextActive
                  ]}>
                    Read
                  </Text>
                  {stats.read > 0 && (
                    <View style={[
                      styles.quickFilterBadge,
                      selectedFilter === 'read' && styles.quickFilterBadgeActive
                    ]}>
                      <Text style={[
                        styles.quickFilterBadgeText,
                        selectedFilter === 'read' && styles.quickFilterBadgeTextActive
                      ]}>
                        {stats.read}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
            <View style={styles.actionButtons}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {readCount > 0 && (
                <TouchableOpacity 
                  onPress={clearReadNotifications} 
                  style={[styles.markAllButton, styles.clearButton]}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </StylistSection>

        {/* Test Push Notifications (Development Only) */}
        <StylistSection>
          <Text style={styles.testSectionTitle}>🧪 Test Push Notifications</Text>
          <View style={styles.testButtonsRow}>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={testLocalNotification}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Local (5s)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.testButton, styles.testButtonFirestore]}
              onPress={testFirestoreNotification}
            >
              <Ionicons name="cloud-outline" size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Firestore</Text>
            </TouchableOpacity>
          </View>
        </StylistSection>

        {/* Notifications List */}
        <StylistSection>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications" size={48} color="#3B82F6" />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedFilter === 'unread' ? 'All Caught Up!' : 
                 selectedFilter === 'read' ? 'No Read Notifications' :
                 'No Notifications Yet'}
              </Text>
              <Text style={styles.emptyMessage}>
                {selectedFilter === 'unread' ? 'Great! You have no unread notifications at the moment.' : 
                 selectedFilter === 'read' ? 'You haven\'t read any notifications yet.' :
                 'You\'ll receive notifications about appointments, cancellations, and important updates here.'}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={flatListData}
              keyExtractor={(item, index) => 
                item.type === 'header' ? `header-${item.groupKey}` : `item-${item.notification?.id}-${index}`
              }
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return renderGroupHeader(item.groupKey!);
                }
                return renderNotificationItem({ item: item.notification! });
              }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={5}
              windowSize={5}
              nestedScrollEnabled={true}
              scrollEnabled={false}
            />
          )}

          {/* Pagination Controls */}
          <StylistPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredNotifications.length}
            itemsPerPage={itemsPerPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
          />
        </StylistSection>
        </>
        )}
      </View>
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
    marginBottom: 12, // Add gap between notifications
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  // Enhanced Stats Card (consistent with other pages)
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
  },
  totalBadge: {
    backgroundColor: APP_CONFIG.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  totalBadgeText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Filter Row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  // Quick Filter Chips (consistent with other pages)
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickFilterChipActive: {
    backgroundColor: APP_CONFIG.primaryColor,
    borderColor: APP_CONFIG.primaryColor,
  },
  quickFilterText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#374151',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  quickFilterBadge: {
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFilterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickFilterBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: APP_CONFIG.primaryColor,
  },
  quickFilterBadgeTextActive: {
    color: '#FFFFFF',
  },
  // Grouped Notifications
  notificationGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#160B53',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 16,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paginationButtonDisabled: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#160B53',
    marginBottom: 2,
  },
  paginationSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // Test Push Notification Styles
  testSectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#6B7280',
    marginBottom: 12,
  },
  testButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  testButtonFirestore: {
    backgroundColor: '#10B981',
  },
  testButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
});
