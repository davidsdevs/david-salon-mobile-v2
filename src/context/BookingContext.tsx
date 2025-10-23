import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Service interface for multiple services
export interface SelectedService {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

// Stylist interface for multiple stylists
export interface SelectedStylist {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
}

// Booking data structure
export interface BookingData {
  branchId: string;
  branchName: string;
  branchAddress: string;
  branchCity: string;
  date: string;
  time: string;
  // Single service fields (for backward compatibility)
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  stylistId: string;
  stylistName: string;
  stylistFirstName: string;
  stylistLastName: string;
  // Multiple services support
  selectedServices: SelectedService[];
  selectedStylists: { [serviceId: string]: SelectedStylist };
  totalPrice: number;
  totalDuration: number;
  notes?: string;
}

// Booking context state
interface BookingState {
  bookingData: Partial<BookingData>;
  currentStep: number;
  isLoading: boolean;
  error: string | null;
}

// Booking actions
type BookingAction =
  | { type: 'SET_BRANCH'; payload: { branchId: string; branchName: string; branchAddress: string; branchCity: string } }
  | { type: 'SET_DATE_TIME'; payload: { date: string; time: string } }
  | { type: 'SET_SERVICE'; payload: { serviceId: string; serviceName: string; servicePrice: number; serviceDuration: number } }
  | { type: 'SET_STYLIST'; payload: { stylistId: string; stylistName: string; stylistFirstName: string; stylistLastName: string } }
  | { type: 'SET_MULTIPLE_SERVICES'; payload: { selectedServices: SelectedService[]; selectedStylists: { [serviceId: string]: SelectedStylist }; totalPrice: number; totalDuration: number } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_BOOKING' }
  | { type: 'UPDATE_BOOKING'; payload: Partial<BookingData> };

// Initial state
const initialState: BookingState = {
  bookingData: {},
  currentStep: 1,
  isLoading: false,
  error: null,
};

// Booking reducer
const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_BRANCH':
      return {
        ...state,
        bookingData: {
          ...state.bookingData,
          branchId: action.payload.branchId,
          branchName: action.payload.branchName,
          branchAddress: action.payload.branchAddress,
          branchCity: action.payload.branchCity,
        },
        currentStep: 2,
        error: null,
      };
    
    case 'SET_DATE_TIME':
      return {
        ...state,
        bookingData: {
          ...state.bookingData,
          date: action.payload.date,
          time: action.payload.time,
        },
        currentStep: 3,
        error: null,
      };
    
    case 'SET_SERVICE':
      return {
        ...state,
        bookingData: {
          ...state.bookingData,
          serviceId: action.payload.serviceId,
          serviceName: action.payload.serviceName,
          servicePrice: action.payload.servicePrice,
          serviceDuration: action.payload.serviceDuration,
        },
        error: null,
      };
    
    case 'SET_STYLIST':
      return {
        ...state,
        bookingData: {
          ...state.bookingData,
          stylistId: action.payload.stylistId,
          stylistName: action.payload.stylistName,
          stylistFirstName: action.payload.stylistFirstName,
          stylistLastName: action.payload.stylistLastName,
        },
        currentStep: 4,
        error: null,
      };
    
    case 'SET_MULTIPLE_SERVICES':
      return {
        ...state,
        bookingData: {
          ...state.bookingData,
          selectedServices: action.payload.selectedServices,
          selectedStylists: action.payload.selectedStylists,
          totalPrice: action.payload.totalPrice,
          totalDuration: action.payload.totalDuration,
          // Set first service as primary for backward compatibility
          serviceId: action.payload.selectedServices[0]?.id || '',
          serviceName: action.payload.selectedServices[0]?.name || '',
          servicePrice: action.payload.totalPrice,
          serviceDuration: action.payload.totalDuration,
          stylistId: action.payload.selectedStylists[action.payload.selectedServices[0]?.id]?.id || '',
          stylistName: action.payload.selectedStylists[action.payload.selectedServices[0]?.id]?.name || '',
          stylistFirstName: action.payload.selectedStylists[action.payload.selectedServices[0]?.id]?.firstName || '',
          stylistLastName: action.payload.selectedStylists[action.payload.selectedServices[0]?.id]?.lastName || '',
        },
        currentStep: 4,
        error: null,
      };
    
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookingData: {
          ...state.bookingData,
          ...action.payload,
        },
      };
    
    case 'RESET_BOOKING':
      return initialState;
    
    default:
      return state;
  }
};

// Booking context
interface BookingContextType {
  state: BookingState;
  setBranch: (branch: { branchId: string; branchName: string; branchAddress: string; branchCity: string }) => void;
  setDateTime: (date: string, time: string) => void;
  setService: (service: { serviceId: string; serviceName: string; servicePrice: number; serviceDuration: number }) => void;
  setStylist: (stylist: { stylistId: string; stylistName: string; stylistFirstName: string; stylistLastName: string }) => void;
  setMultipleServices: (data: { selectedServices: SelectedService[]; selectedStylists: { [serviceId: string]: SelectedStylist }; totalPrice: number; totalDuration: number }) => void;
  setStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateBooking: (data: Partial<BookingData>) => void;
  resetBooking: () => void;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Booking provider
export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const setBranch = (branch: { branchId: string; branchName: string; branchAddress: string; branchCity: string }) => {
    dispatch({ type: 'SET_BRANCH', payload: branch });
  };

  const setDateTime = (date: string, time: string) => {
    dispatch({ type: 'SET_DATE_TIME', payload: { date, time } });
  };

  const setService = (service: { serviceId: string; serviceName: string; servicePrice: number; serviceDuration: number }) => {
    dispatch({ type: 'SET_SERVICE', payload: service });
  };

  const setStylist = (stylist: { stylistId: string; stylistName: string; stylistFirstName: string; stylistLastName: string }) => {
    dispatch({ type: 'SET_STYLIST', payload: stylist });
  };

  const setMultipleServices = (data: { selectedServices: SelectedService[]; selectedStylists: { [serviceId: string]: SelectedStylist }; totalPrice: number; totalDuration: number }) => {
    dispatch({ type: 'SET_MULTIPLE_SERVICES', payload: data });
  };

  const setStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const updateBooking = (data: Partial<BookingData>) => {
    dispatch({ type: 'UPDATE_BOOKING', payload: data });
  };

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  const goToPreviousStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const goToNextStep = () => {
    if (state.currentStep < 4) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const value: BookingContextType = {
    state,
    setBranch,
    setDateTime,
    setService,
    setStylist,
    setMultipleServices,
    setStep,
    setLoading,
    setError,
    updateBooking,
    resetBooking,
    goToPreviousStep,
    goToNextStep,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

// Custom hook to use booking context
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export default BookingContext;
