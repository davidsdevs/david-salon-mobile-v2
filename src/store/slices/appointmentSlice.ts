import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Appointment, 
  CreateAppointmentRequest, 
  UpdateAppointmentRequest,
  SearchFilters,
  SearchResponse,
  ApiResponse,
  PaginatedResponse
} from '../../types/api';

interface AppointmentState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: AppointmentState = {
  appointments: [],
  currentAppointment: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 20,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
};

// Async thunks
export const fetchAppointments = createAsyncThunk<
  PaginatedResponse<Appointment>,
  SearchFilters,
  { rejectValue: string }
>(
  'appointments/fetchAppointments',
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

      const response = await fetch(`/api/appointments?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch appointments');
      }

      const data: ApiResponse<PaginatedResponse<Appointment>> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch appointments');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch appointments'
      );
    }
  }
);

export const fetchAppointmentById = createAsyncThunk<
  Appointment,
  string,
  { rejectValue: string }
>(
  'appointments/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch appointment');
      }

      const data: ApiResponse<Appointment> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch appointment');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch appointment'
      );
    }
  }
);

export const createAppointment = createAsyncThunk<
  Appointment,
  CreateAppointmentRequest,
  { rejectValue: string }
>(
  'appointments/create',
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create appointment');
      }

      const data: ApiResponse<Appointment> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create appointment');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create appointment'
      );
    }
  }
);

export const updateAppointment = createAsyncThunk<
  Appointment,
  { id: string; data: UpdateAppointmentRequest },
  { rejectValue: string }
>(
  'appointments/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update appointment');
      }

      const responseData: ApiResponse<Appointment> = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to update appointment');
      }

      return responseData.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update appointment'
      );
    }
  }
);

export const deleteAppointment = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'appointments/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete appointment');
      }

      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete appointment'
      );
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentAppointment: (state, action: PayloadAction<Appointment | null>) => {
      state.currentAppointment = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearAppointments: (state) => {
      state.appointments = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload.data;
        state.pagination = {
          page: action.payload.pagination.page,
          limit: action.payload.pagination.limit,
          total: action.payload.pagination.total,
          hasMore: action.payload.pagination.hasNext,
        };
        state.error = null;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch appointments';
      })
      // Fetch appointment by ID
      .addCase(fetchAppointmentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAppointment = action.payload;
        state.error = null;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch appointment';
      })
      // Create appointment
      .addCase(createAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments.unshift(action.payload);
        state.error = null;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create appointment';
      })
      // Update appointment
      .addCase(updateAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(
          (appointment) => appointment.id === action.payload.id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.currentAppointment?.id === action.payload.id) {
          state.currentAppointment = action.payload;
        }
      })
      // Delete appointment
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.appointments = state.appointments.filter(
          (appointment) => appointment.id !== action.payload
        );
        if (state.currentAppointment?.id === action.payload) {
          state.currentAppointment = null;
        }
      });
  },
});

export const { 
  clearError, 
  setCurrentAppointment, 
  updateFilters, 
  clearAppointments 
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
