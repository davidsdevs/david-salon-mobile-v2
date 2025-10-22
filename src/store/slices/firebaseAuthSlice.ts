import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginRequest, RegisterRequest, ApiResponse } from '../../types/api';
import { authService } from '../../services/authService';
import { User as FirebaseUser } from 'firebase/auth';

interface FirebaseAuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: FirebaseAuthState = {
  user: null,
  firebaseUser: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Async thunks
export const loginWithFirebase = createAsyncThunk<
  { user: User; token: string },
  LoginRequest,
  { rejectValue: string }
>(
  'firebaseAuth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed'
      );
    }
  }
);

export const registerWithFirebase = createAsyncThunk<
  { user: User; token: string },
  RegisterRequest,
  { rejectValue: string }
>(
  'firebaseAuth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Registration failed'
      );
    }
  }
);

export const logoutFromFirebase = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'firebaseAuth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Logout failed'
      );
    }
  }
);

export const resetPassword = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'firebaseAuth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      await authService.resetPassword(email);
      return;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Password reset failed'
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  User,
  { uid: string; updates: Partial<User> },
  { rejectValue: string }
>(
  'firebaseAuth/updateProfile',
  async ({ uid, updates }, { rejectWithValue }) => {
    try {
      await authService.updateUserProfile(uid, updates);
      
      // Get updated user data
      const userData = await authService.getUserData(uid);
      if (!userData) {
        throw new Error('User data not found');
      }

      // Convert to API format
                const user: User = {
                  id: userData.id,
                  uid: userData.uid || userData.id,
                  email: userData.email,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  phone: userData.phone || '',
                  profileImage: userData.profileImage,
                  userType: userData.userType,
                  roles: userData.roles || [userData.userType],
                  isActive: userData.isActive,
                  createdAt: userData.createdAt.toDate().toISOString(),
                  updatedAt: userData.updatedAt.toDate().toISOString(),
                };

      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Profile update failed'
      );
    }
  }
);

export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>(
  'firebaseAuth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Password change failed'
      );
    }
  }
);

export const initializeAuth = createAsyncThunk<
  { user: User | null; firebaseUser: FirebaseUser | null },
  void,
  { rejectValue: string }
>(
  'firebaseAuth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      return new Promise((resolve, reject) => {
        const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
          unsubscribe();
          
          if (firebaseUser) {
            try {
              const token = await firebaseUser.getIdToken();
              const userData = await authService.getUserData(firebaseUser.uid);
              
              if (userData) {
                const user: User = {
                  id: userData.id,
                  uid: userData.uid || userData.id,
                  email: userData.email,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  phone: userData.phone || '',
                  profileImage: userData.profileImage,
                  userType: userData.userType,
                  roles: userData.roles || [userData.userType],
                  isActive: userData.isActive,
                  createdAt: userData.createdAt.toDate().toISOString(),
                  updatedAt: userData.updatedAt.toDate().toISOString(),
                };
                
                resolve({ user, firebaseUser });
              } else {
                resolve({ user: null, firebaseUser });
              }
            } catch (error) {
              reject(error);
            }
          } else {
            resolve({ user: null, firebaseUser: null });
          }
        });
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Auth initialization failed'
      );
    }
  }
);

const firebaseAuthSlice = createSlice({
  name: 'firebaseAuth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<{ user: User | null; firebaseUser: FirebaseUser | null }>) => {
      state.user = action.payload.user;
      state.firebaseUser = action.payload.firebaseUser;
      state.isAuthenticated = !!action.payload.user;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginWithFirebase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithFirebase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithFirebase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerWithFirebase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithFirebase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerWithFirebase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutFromFirebase.fulfilled, (state) => {
        state.user = null;
        state.firebaseUser = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutFromFirebase.rejected, (state, action) => {
        state.error = action.payload || 'Logout failed';
      })
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Password reset failed';
      })
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload || 'Profile update failed';
      })
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Password change failed';
      })
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.firebaseUser = action.payload.firebaseUser;
        state.isAuthenticated = !!action.payload.user;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Auth initialization failed';
        state.isInitialized = true;
      });
  },
});

export const { clearError, setUser, setToken } = firebaseAuthSlice.actions;
export default firebaseAuthSlice.reducer;
