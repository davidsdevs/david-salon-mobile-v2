import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG, FONTS } from '../constants';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 4000,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide after duration
    setTimeout(() => {
      hideNotification(id);
    }, newNotification.duration);
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getIconName = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '#34C759'; // iOS green
      case 'error':
        return '#FF3B30'; // iOS red
      case 'warning':
        return '#FF9500'; // iOS orange
      case 'info':
      default:
        return '#007AFF'; // iOS blue
    }
  };

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '#E8F5E9';
      case 'error':
        return '#FFEBEE';
      case 'warning':
        return '#FFF3E0';
      case 'info':
      default:
        return '#E3F2FD';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <View style={styles.container}>
        {notifications.map((notification) => (
          <Animated.View
            key={notification.id}
            style={styles.notification}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: getBackgroundColor(notification.type) }
            ]}>
              <Ionicons
                name={getIconName(notification.type)}
                size={22}
                color={getColor(notification.type)}
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.message}>{notification.message}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => hideNotification(notification.id)}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 8,
    right: 8,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  notification: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
    borderRadius: Platform.OS === 'ios' ? 16 : 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    borderLeftWidth: 0,
    minHeight: 64,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#000000',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#3C3C43',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
    marginTop: -4,
  },
});
