// Legacy useAuth hook - now uses Redux
// This file is kept for backward compatibility
// New code should use the Redux-based hooks from './redux'

import { useAuth as useReduxAuth } from './redux';

export default function useAuth() {
  const { user, login, logout, isLoading, error } = useReduxAuth();
  
  // Legacy saveUser function for backward compatibility
  const saveUser = async (userData: any, rememberMe = false) => {
    // This is now handled by Redux login action
    console.warn('saveUser is deprecated. Use Redux login action instead.');
  };

  return { 
    user, 
    saveUser, 
    logout,
    isLoading,
    error
  };
}
