import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginRequest, LoginResponse, ApiResponse, RegisterRequest } from '../../types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirebaseAuthService from '../../services/firebaseAuthService';

// Helper function to convert Firestore Timestamps to ISO strings
const convertTimestampsInObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'object') {
    if (obj.type === 'firestore/timestamp/1.0' || (obj.seconds !== undefined && obj.nanoseconds !== undefined)) {
      // This is a Firestore Timestamp
      return obj.toDate?.()?.toISOString() || new Date().toISOString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(convertTimestampsInObject);
    }
    
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertTimestampsInObject(obj[key]);
    }
    return converted;
  }
  
  return obj;
};

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔄 loginUser: Starting login for:', credentials.email);
      const result = await FirebaseAuthService.signIn(credentials);
      console.log('🔄 loginUser: Login successful, user data:', { 
        id: result.user?.id, 
        email: result.user?.email, 
        userType: result.user?.userType 
      });
      
      return {
        user: convertTimestampsInObject(result.user),
        token: result.token,
        refreshToken: result.refreshToken,
        expiresIn: 3600 // Firebase tokens typically expire in 1 hour
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed'
      );
    }
  }
);

export const registerUser = createAsyncThunk<
  LoginResponse,
  RegisterRequest,
  { rejectValue: string }
>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const result = await FirebaseAuthService.register(userData);
      
      return {
        user: convertTimestampsInObject(result.user),
        token: result.token,
        refreshToken: result.refreshToken,
        expiresIn: 3600 // Firebase tokens typically expire in 1 hour
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Registration failed'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await FirebaseAuthService.signOut();
      return true;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

export const refreshAuthToken = createAsyncThunk<
  { token: string; refreshToken: string },
  void,
  { rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = await FirebaseAuthService.getToken();
      
      if (!token) {
        throw new Error('No token available');
      }

      // For Firebase, we use the same token as both token and refresh token
      // Firebase handles token refresh automatically
      return {
        token,
        refreshToken: token
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Token refresh failed'
      );
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 loadStoredAuth: Starting...');
      // Check if Firebase user is already authenticated
      const currentUser = FirebaseAuthService.getCurrentUser();
      console.log('🔄 loadStoredAuth: Current Firebase user:', currentUser?.uid);
      
      if (currentUser) {
        // Get fresh user profile from Firestore
        console.log('🔄 loadStoredAuth: Getting user profile from Firestore...');
        const userProfile = await FirebaseAuthService.getUserProfile(currentUser.uid);
        console.log('🔄 loadStoredAuth: User profile loaded:', { 
          id: userProfile?.id, 
          email: userProfile?.email, 
          userType: userProfile?.userType,
          role: (userProfile as any)?.role
        });
        
        if (userProfile) {
          // Check if user is allowed to login (only client and stylist)
          if (!['client', 'stylist'].includes(userProfile.userType)) {
            console.log('🔄 loadStoredAuth: Invalid user type, clearing auth:', userProfile.userType);
            // Clear invalid user data
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
            return null;
          }
          
          const token = await currentUser.getIdToken();
          console.log('🔄 loadStoredAuth: Returning fresh user data');
          return {
            user: convertTimestampsInObject(userProfile),
            token,
            refreshToken: token
          };
        }
      }

      // Fallback to stored data
      console.log('🔄 loadStoredAuth: No current user, checking stored data...');
      const [token, refreshToken, userData] = await AsyncStorage.multiGet([
        'authToken',
        'refreshToken',
        'user',
      ]);

      console.log('🔄 loadStoredAuth: Stored data check:', {
        hasToken: !!token?.[1],
        hasUserData: !!userData?.[1]
      });

      if (token && token[1] && userData && userData[1]) {
        const user = JSON.parse(userData[1]);
        console.log('🔄 loadStoredAuth: Stored user data:', { 
          id: user?.id, 
          email: user?.email, 
          userType: user?.userType 
        });
        
        // Check if stored user is allowed to login (only client and stylist)
        if (!['client', 'stylist'].includes(user.userType)) {
          console.log('🔄 loadStoredAuth: Invalid stored user type, clearing auth:', user.userType);
          await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
          return null;
        }
        
        // Convert any remaining timestamps in stored data
        const convertedUser = convertTimestampsInObject(user);
        console.log('🔄 loadStoredAuth: Returning stored user data');
        return {
          user: convertedUser,
          token: token[1],
          refreshToken: refreshToken?.[1] || '',
        };
      }

      console.log('🔄 loadStoredAuth: No stored data found, returning null');
      return null;
    } catch (error) {
      return rejectWithValue('Failed to load stored authentication');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        console.log('🔄 Redux: loginUser.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('🔄 Redux: loginUser.fulfilled', { 
          user: action.payload.user?.email, 
          userType: action.payload.user?.userType 
        });
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        console.log('🔄 Redux: logoutUser.pending - setting isLoading to true');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('✅ Redux: logoutUser.fulfilled - setting isAuthenticated to false');
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        console.log('✅ Redux: logoutUser.fulfilled - state updated:', { 
          isAuthenticated: state.isAuthenticated, 
          user: state.user, 
          isLoading: state.isLoading 
        });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.log('❌ Redux: logoutUser.rejected - logout failed:', action.payload);
        state.isLoading = false;
        state.error = (action.payload as string) || 'Logout failed';
        // Don't change isAuthenticated on logout failure
      })
      // Refresh token
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Load stored auth
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        console.log('🔄 Redux: loadStoredAuth.fulfilled', { 
          hasPayload: !!action.payload,
          user: action.payload?.user?.email, 
          userType: action.payload?.user?.userType 
        });
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
