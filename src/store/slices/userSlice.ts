import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, Client, Stylist, ApiResponse, SearchFilters } from '../../types/api';

interface UserState {
  users: User[];
  currentUser: User | null;
  clients: Client[];
  stylists: Stylist[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  clients: [],
  stylists: [],
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 20,
  },
};

// Async thunks
export const fetchUsers = createAsyncThunk<
  User[],
  SearchFilters,
  { rejectValue: string }
>(
  'users/fetchUsers',
  async (filters, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/users?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }

      const data: ApiResponse<User[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch users'
      );
    }
  }
);

export const fetchClients = createAsyncThunk<
  Client[],
  SearchFilters,
  { rejectValue: string }
>(
  'users/fetchClients',
  async (filters, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/users/clients?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch clients');
      }

      const data: ApiResponse<Client[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch clients');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch clients'
      );
    }
  }
);

export const fetchStylists = createAsyncThunk<
  Stylist[],
  SearchFilters,
  { rejectValue: string }
>(
  'users/fetchStylists',
  async (filters, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/users/stylists?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch stylists');
      }

      const data: ApiResponse<Stylist[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stylists');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch stylists'
      );
    }
  }
);

export const fetchUserById = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>(
  'users/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user');
      }

      const data: ApiResponse<User> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch user'
      );
    }
  }
);

export const updateUser = createAsyncThunk<
  User,
  { id: string; data: Partial<User> },
  { rejectValue: string }
>(
  'users/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const responseData: ApiResponse<User> = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to update user');
      }

      return responseData.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update user'
      );
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearUsers: (state) => {
      state.users = [];
      state.clients = [];
      state.stylists = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch users';
      })
      // Fetch clients
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload;
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch clients';
      })
      // Fetch stylists
      .addCase(fetchStylists.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStylists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stylists = action.payload;
        state.error = null;
      })
      .addCase(fetchStylists.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch stylists';
      })
      // Fetch user by ID
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      });
  },
});

export const { 
  clearError, 
  setCurrentUser, 
  updateFilters, 
  clearUsers 
} = userSlice.actions;

export default userSlice.reducer;
