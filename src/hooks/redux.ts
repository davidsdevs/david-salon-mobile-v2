import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  loginUser, 
  registerUser,
  logoutUser, 
  refreshAuthToken, 
  loadStoredAuth,
  clearError as clearAuthError,
  updateUser as updateAuthUser
} from '../store/slices/authSlice';
import { UpdateAppointmentRequest } from '../types/api';
import { 
  fetchAppointments,
  fetchAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  clearError as clearAppointmentError,
  setCurrentAppointment,
  updateFilters as updateAppointmentFilters
} from '../store/slices/appointmentSlice';
import { 
  fetchUsers,
  fetchClients,
  fetchStylists,
  fetchUserById,
  updateUser,
  clearError as clearUserError,
  setCurrentUser,
  updateFilters as updateUserFilters
} from '../store/slices/userSlice';
import { 
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  clearError as clearNotificationError,
  addNotification,
  updateUnreadCount
} from '../store/slices/notificationSlice';

// Auth hooks
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const login = useCallback((credentials: Parameters<typeof loginUser>[0]) => {
    return dispatch(loginUser(credentials));
  }, [dispatch]);

  const register = useCallback((userData: Parameters<typeof registerUser>[0]) => {
    return dispatch(registerUser(userData));
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const refreshToken = useCallback(() => {
    return dispatch(refreshAuthToken());
  }, [dispatch]);

  const loadStored = useCallback(() => {
    return dispatch(loadStoredAuth());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const updateUserProfile = useCallback((userData: Parameters<typeof updateAuthUser>[0]) => {
    dispatch(updateAuthUser(userData));
  }, [dispatch]);

  return {
    ...auth,
    login,
    register,
    logout,
    refreshToken,
    loadStored,
    clearError,
    updateUserProfile,
  };
};

// Appointment hooks
export const useAppointments = () => {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((state) => state.appointments);

  const fetch = useCallback((filters: Parameters<typeof fetchAppointments>[0]) => {
    return dispatch(fetchAppointments(filters));
  }, [dispatch]);

  const fetchById = useCallback((id: string) => {
    return dispatch(fetchAppointmentById(id));
  }, [dispatch]);

  const create = useCallback((data: Parameters<typeof createAppointment>[0]) => {
    return dispatch(createAppointment(data));
  }, [dispatch]);

  const update = useCallback((id: string, data: UpdateAppointmentRequest) => {
    return dispatch(updateAppointment({ id, data }));
  }, [dispatch]);

  const remove = useCallback((id: string) => {
    return dispatch(deleteAppointment(id));
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAppointmentError());
  }, [dispatch]);

  const setCurrent = useCallback((appointment: Parameters<typeof setCurrentAppointment>[0]) => {
    dispatch(setCurrentAppointment(appointment));
  }, [dispatch]);

  const updateFilters = useCallback((filters: Parameters<typeof updateAppointmentFilters>[0]) => {
    dispatch(updateAppointmentFilters(filters));
  }, [dispatch]);

  return {
    ...appointments,
    fetch,
    fetchById,
    create,
    update,
    remove,
    clearError,
    setCurrent,
    updateFilters,
  };
};

// User hooks
export const useUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users);

  const fetchAll = useCallback((filters: Parameters<typeof fetchUsers>[0]) => {
    return dispatch(fetchUsers(filters));
  }, [dispatch]);

  const fetchClients = useCallback((filters: any): any => {
    return dispatch(fetchClients(filters));
  }, [dispatch]);

  const fetchStylists = useCallback((filters: any): any => {
    return dispatch(fetchStylists(filters));
  }, [dispatch]);

  const fetchById = useCallback((id: string) => {
    return dispatch(fetchUserById(id));
  }, [dispatch]);

  const update = useCallback((id: string, data: Parameters<typeof updateUser>[0]) => {
    return dispatch(updateUser({ id, data }));
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearUserError());
  }, [dispatch]);

  const setCurrent = useCallback((user: Parameters<typeof setCurrentUser>[0]) => {
    dispatch(setCurrentUser(user));
  }, [dispatch]);

  const updateFilters = useCallback((filters: Parameters<typeof updateUserFilters>[0]) => {
    dispatch(updateUserFilters(filters));
  }, [dispatch]);

  return {
    ...users,
    fetchAll,
    fetchClients,
    fetchStylists,
    fetchById,
    update,
    clearError,
    setCurrent,
    updateFilters,
  };
};

// Notification hooks
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications);

  const fetch = useCallback((filters: Parameters<typeof fetchNotifications>[0]) => {
    return dispatch(fetchNotifications(filters));
  }, [dispatch]);

  const markAsRead = useCallback((id: string) => {
    return dispatch(markNotificationAsRead(id));
  }, [dispatch]);

  const markAllAsRead = useCallback(() => {
    return dispatch(markAllNotificationsAsRead());
  }, [dispatch]);

  const remove = useCallback((id: string) => {
    return dispatch(deleteNotification(id));
  }, [dispatch]);

  const create = useCallback((data: Parameters<typeof createNotification>[0]) => {
    return dispatch(createNotification(data));
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearNotificationError());
  }, [dispatch]);

  const add = useCallback((notification: Parameters<typeof addNotification>[0]) => {
    dispatch(addNotification(notification));
  }, [dispatch]);

  const updateCount = useCallback((count: Parameters<typeof updateUnreadCount>[0]) => {
    dispatch(updateUnreadCount(count));
  }, [dispatch]);

  return {
    ...notifications,
    fetch,
    markAsRead,
    markAllAsRead,
    remove,
    create,
    clearError,
    add,
    updateCount,
  };
};
