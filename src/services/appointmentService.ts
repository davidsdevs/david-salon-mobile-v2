import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FirestoreAppointment, FirestoreService, FirestoreStylist, FirestoreBranch } from '../types/firebase';
import { Appointment, Service, Stylist, Branch } from '../types/api';

export class AppointmentService {
  private static readonly COLLECTION_NAME = 'appointments';
  private static readonly SERVICES_COLLECTION = 'services';
  private static readonly STYLISTS_COLLECTION = 'stylists';
  private static readonly BRANCHES_COLLECTION = 'branches';

  // Get branch names by IDs
  static async getBranchNames(branchIds: string[]): Promise<{ [branchId: string]: string }> {
    try {
      console.log('🔄 Fetching branch names for IDs:', branchIds);
      
      if (branchIds.length === 0) {
        return {};
      }

      const branchNames: { [branchId: string]: string } = {};
      
      // Fetch all branches and filter by the IDs we need
      const branchesRef = collection(db, this.BRANCHES_COLLECTION);
      const querySnapshot = await getDocs(branchesRef);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (branchIds.includes(doc.id)) {
          branchNames[doc.id] = data.name || 'Unknown Branch';
          console.log(`✅ Found branch: ${doc.id} -> ${data.name}`);
        }
      });
      
      console.log('📋 Branch names mapping:', branchNames);
      return branchNames;
    } catch (error) {
      console.error('❌ Error fetching branch names:', error);
      return {};
    }
  }

  // Get service names by IDs
  static async getServiceNames(serviceIds: string[]): Promise<{ [serviceId: string]: string }> {
    try {
      console.log('🔄 Fetching service names for IDs:', serviceIds);
      
      if (serviceIds.length === 0) {
        return {};
      }

      const serviceNames: { [serviceId: string]: string } = {};
      
      // Fetch all services and filter by the IDs we need
      const servicesRef = collection(db, this.SERVICES_COLLECTION);
      const querySnapshot = await getDocs(servicesRef);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (serviceIds.includes(doc.id)) {
          serviceNames[doc.id] = data.name || 'Unknown Service';
          console.log(`✅ Found service: ${doc.id} -> ${data.name}`);
        }
      });
      
      console.log('📋 Service names mapping:', serviceNames);
      return serviceNames;
    } catch (error) {
      console.error('❌ Error fetching service names:', error);
      return {};
    }
  }

  // Get all appointments for a client
  static async getClientAppointments(clientId: string): Promise<Appointment[]> {
    try {
      console.log('🔍 Fetching appointments for clientId:', clientId);
      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      
      // Try both clientId and uid fields to handle different data structures
      const queries = [
        query(appointmentsRef, where('clientId', '==', clientId)),
        query(appointmentsRef, where('uid', '==', clientId)),
        query(appointmentsRef, where('userId', '==', clientId))
      ];
      
      const allAppointments: Appointment[] = [];
      
      for (const q of queries) {
        try {
          console.log('🔍 Executing query...');
          const snapshot = await getDocs(q);
          console.log('📊 Query returned', snapshot.docs.length, 'documents');
          
          for (const docSnapshot of snapshot.docs) {
            try {
              console.log('🔄 Processing document:', docSnapshot.id);
              const appointmentData = docSnapshot.data() as FirestoreAppointment;
              console.log('📋 Raw appointment data:', {
                id: docSnapshot.id,
                clientId: appointmentData.clientId,
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
                serviceIds: appointmentData.serviceIds,
                status: appointmentData.status
              });
              
              const appointment = await this.mapFirestoreToAppointment(appointmentData, docSnapshot.id);
              console.log('✅ Mapped appointment:', {
                id: appointment.id,
                serviceIds: appointment.serviceIds,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                status: appointment.status
              });
              
              allAppointments.push(appointment);
            } catch (mappingError) {
              console.error('❌ Error mapping appointment:', docSnapshot.id, mappingError);
              // Continue with other appointments
            }
          }
        } catch (queryError) {
          console.log('⚠️ Query failed, trying next:', queryError);
        }
      }

      console.log('📊 Total appointments found:', allAppointments.length);

      // Remove duplicates based on appointment ID
      const uniqueAppointments = allAppointments.filter((appointment, index, self) => 
        index === self.findIndex(a => a.id === appointment.id)
      );

      console.log('📊 Unique appointments after deduplication:', uniqueAppointments.length);

      // Sort client-side to avoid composite index requirement
      const sortedAppointments = uniqueAppointments.sort((a, b) => {
        // Use new date fields with fallbacks
        const dateA = new Date(a.appointmentDate || a.date);
        const dateB = new Date(b.appointmentDate || b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        // If dates are equal, sort by time (descending)
        const timeA = a.appointmentTime || a.startTime;
        const timeB = b.appointmentTime || b.startTime;
        return timeB.localeCompare(timeA);
      });

      console.log('✅ Returning', sortedAppointments.length, 'appointments');
      return sortedAppointments;
    } catch (error) {
      console.error('❌ Error fetching client appointments:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('Failed to fetch appointments');
    }
  }

  // Get appointment by ID
  static async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const appointmentDoc = await getDoc(doc(db, this.COLLECTION_NAME, appointmentId));
      
      if (appointmentDoc.exists()) {
        const appointmentData = appointmentDoc.data() as FirestoreAppointment;
        return await this.mapFirestoreToAppointment(appointmentData, appointmentDoc.id);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw new Error('Failed to fetch appointment');
    }
  }

  // Create new appointment
  static async createAppointment(appointmentData: Partial<Appointment>): Promise<string> {
    try {
      const appointmentRef = collection(db, this.COLLECTION_NAME);
      const docRef = await addDoc(appointmentRef, {
        ...appointmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  }

  // Update appointment
  static async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<void> {
    try {
      const appointmentRef = doc(db, this.COLLECTION_NAME, appointmentId);
      await updateDoc(appointmentRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment');
    }
  }

  // Cancel appointment
  static async cancelAppointment(appointmentId: string, reason: string): Promise<void> {
    try {
      const appointmentRef = doc(db, this.COLLECTION_NAME, appointmentId);
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment');
    }
  }

  // Reschedule appointment
  static async rescheduleAppointment(
    appointmentId: string, 
    newDate: string, 
    newTime: string, 
    notes: string = ''
  ): Promise<void> {
    try {
      console.log('🔄 Rescheduling appointment:', appointmentId, 'to', newDate, newTime);
      const appointmentRef = doc(db, this.COLLECTION_NAME, appointmentId);
      
      // Get current appointment data to access history
      const appointmentDoc = await getDoc(appointmentRef);
      const currentData = appointmentDoc.data();
      
      if (!currentData) {
        throw new Error('Appointment not found');
      }
      
      // Create history entry for reschedule
      const historyEntry = {
        action: 'rescheduled',
        timestamp: new Date().toISOString(),
        oldDate: currentData.appointmentDate || currentData.date,
        oldTime: currentData.appointmentTime || currentData.startTime,
        newDate: newDate,
        newTime: newTime,
        notes: notes,
        rescheduledBy: 'client'
      };
      
      // Add to existing history array
      const existingHistory = currentData.history || [];
      const updatedHistory = [...existingHistory, historyEntry];
      
      const updateData = {
        appointmentDate: newDate,
        appointmentTime: newTime,
        date: newDate,
        startTime: newTime,
        status: 'scheduled', // Keep as scheduled, not pending_reschedule
        notes: notes, // Update notes field instead of rescheduleNotes
        history: updatedHistory,
        updatedAt: Timestamp.now(),
      };
      
      console.log('📝 Updating appointment with data:', updateData);
      console.log('📊 History entry:', historyEntry);
      
      // Update the appointment with new date/time and history
      await updateDoc(appointmentRef, updateData);
      
      console.log('✅ Appointment rescheduled successfully with history logged');
    } catch (error) {
      console.error('❌ Error rescheduling appointment:', error);
      console.error('❌ Error details:', {
        appointmentId,
        newDate,
        newTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('Failed to reschedule appointment');
    }
  }

  // Subscribe to real-time updates for client appointments
  static subscribeToClientAppointments(
    clientId: string,
    callback: (appointments: Appointment[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time subscription for clientId:', clientId);
    const appointmentsRef = collection(db, this.COLLECTION_NAME);
    
    // Try clientId first (receptionist structure)
    const q = query(
      appointmentsRef,
      where('clientId', '==', clientId)
    );

    return onSnapshot(q, async (snapshot) => {
      console.log('📡 Real-time snapshot received:', snapshot.docs.length, 'documents');
      const appointments: Appointment[] = [];

      for (const docSnapshot of snapshot.docs) {
        try {
          console.log('🔄 Processing real-time document:', docSnapshot.id);
          const appointmentData = docSnapshot.data() as FirestoreAppointment;
          const appointment = await this.mapFirestoreToAppointment(appointmentData, docSnapshot.id);
          appointments.push(appointment);
        } catch (error) {
          console.error('❌ Error processing real-time appointment:', docSnapshot.id, error);
        }
      }

      // Sort client-side to avoid composite index requirement
      const sortedAppointments = appointments.sort((a, b) => {
        // Use new date fields with fallbacks
        const dateA = new Date(a.appointmentDate || a.date);
        const dateB = new Date(b.appointmentDate || b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        // If dates are equal, sort by time (descending)
        const timeA = a.appointmentTime || a.startTime;
        const timeB = b.appointmentTime || b.startTime;
        return timeB.localeCompare(timeA);
      });

      console.log('✅ Real-time callback with', sortedAppointments.length, 'appointments');
      callback(sortedAppointments);
    }, (error) => {
      console.error('❌ Error in real-time appointment subscription:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    });
  }

  // Helper method to map Firestore data to API format
  private static async mapFirestoreToAppointment(
    firestoreData: FirestoreAppointment, 
    docId: string
  ): Promise<Appointment> {
    try {
      console.log('🔄 Mapping appointment data:', {
        id: docId,
        clientId: firestoreData.clientId,
        serviceId: firestoreData.serviceId,
        stylistId: firestoreData.stylistId,
        branchId: firestoreData.branchId,
        date: firestoreData.date,
        startTime: firestoreData.startTime,
        status: firestoreData.status
      });

      // Try to get stylist name from users collection using serviceStylistPairs
      let stylistName = 'Stylist Name';
      let stylistFirstName = 'Stylist';
      let stylistLastName = 'Name';
      
      if (firestoreData.serviceStylistPairs && firestoreData.serviceStylistPairs.length > 0) {
        const firstPair = firestoreData.serviceStylistPairs[0];
        if (firstPair.stylistId) {
          try {
            // Fetch from users collection using the stylistId (which is the uid)
            const userDoc = await getDoc(doc(db, 'users', firstPair.stylistId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              stylistFirstName = userData.firstName || 'Stylist';
              stylistLastName = userData.lastName || 'Name';
              stylistName = `${stylistFirstName} ${stylistLastName}`;
              console.log('✅ Found stylist name from users collection:', stylistName);
            }
          } catch (error) {
            console.log('⚠️ Could not fetch stylist name from users collection:', error);
          }
        }
      }
      
      // For now, skip fetching other related data to avoid errors
      let serviceData = null;
      let stylistData = null;
      let branchData = null;
      
      console.log('⚠️ Skipping other related data fetch for now to focus on basic appointment display');

      console.log('🔄 Fetched related data:', {
        service: serviceData ? { id: serviceData.id, name: serviceData.name } : null,
        stylist: stylistData ? { id: stylistData.id, name: `${stylistData.firstName} ${stylistData.lastName}` } : null,
        branch: branchData ? { id: branchData.id, name: branchData.name } : null
      });

      // Handle different data structures from web vs mobile
      const appointmentDate = firestoreData.appointmentDate || firestoreData.date || firestoreData.scheduledDate;
      const appointmentTime = firestoreData.appointmentTime || firestoreData.time || firestoreData.startTime;
      
      // Get first service and stylist from arrays (receptionist structure)
      const firstService = firestoreData.services && firestoreData.services.length > 0 ? firestoreData.services[0] : null;
      const firstStylist = firestoreData.stylists && firestoreData.stylists.length > 0 ? firestoreData.stylists[0] : null;
      
      // Calculate total cost from services array
      const totalCost = firestoreData.services ? 
        firestoreData.services.reduce((sum, service) => sum + (service.price || 0), 0) : 
        (firestoreData.totalCost || firestoreData.price || 0);

      // Get primary stylist and service from serviceStylistPairs
      let primaryStylistId = '';
      let primaryServiceId = '';
      
      if (firestoreData.serviceStylistPairs && firestoreData.serviceStylistPairs.length > 0) {
        const firstPair = firestoreData.serviceStylistPairs[0];
        primaryStylistId = firstPair.stylistId;
        primaryServiceId = firstPair.serviceId;
      }

      return {
        id: docId,
        clientId: firestoreData.clientId,
        stylistId: primaryStylistId,
        serviceId: primaryServiceId,
        branchId: firestoreData.branchId,
        date: appointmentDate,
        appointmentDate: firestoreData.appointmentDate,
        startTime: appointmentTime,
        appointmentTime: firestoreData.appointmentTime,
        endTime: firestoreData.endTime || '',
        duration: firstService?.duration || 60, // Default duration
        status: firestoreData.status,
        notes: firestoreData.notes || '',
        clientNotes: firestoreData.clientNotes || '',
        stylistNotes: firestoreData.stylistNotes || '',
        price: totalCost,
        discount: firestoreData.discount || 0,
        finalPrice: firestoreData.finalPrice || totalCost,
        paymentStatus: firestoreData.paymentStatus || 'pending',
        paymentMethod: firestoreData.paymentMethod || 'cash',
        createdAt: firestoreData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: firestoreData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        // New Firestore fields
        clientInfo: firestoreData.clientInfo,
        clientName: firestoreData.clientInfo?.clientName || firestoreData.clientName,
        createdBy: firestoreData.createdBy,
        history: firestoreData.history || [],
        primaryStylistId: primaryStylistId,
        serviceStylistPairs: firestoreData.serviceStylistPairs || [],
        service: serviceData || (firstService ? {
          id: firstService.id,
          name: firstService.name,
          description: firstService.description || '',
          price: firstService.price,
          duration: firstService.duration,
          category: (firstService as any).category || (firstService as any).categoryId || '',
          requiresStylist: true,
          maxConcurrent: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } : undefined),
        stylist: stylistData || {
          id: primaryStylistId || 'unknown',
          firstName: stylistFirstName,
          lastName: stylistLastName,
          email: '',
          phone: '',
          userType: 'stylist' as const,
          employeeId: '',
          specialization: [],
          experience: 0,
          rating: 0,
          totalClients: 0,
          totalEarnings: 0,
          isAvailable: true,
          isActive: true,
          workingHours: {},
          services: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        branch: branchData || {
          id: firestoreData.branchId,
          name: `Branch ${firestoreData.branchId}`,
          address: '',
          phone: '',
          email: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Additional fields for compatibility
        services: firestoreData.services || [],
        stylists: firestoreData.stylists || [],
        clientFirstName: firestoreData.clientFirstName,
        clientLastName: firestoreData.clientLastName,
        clientPhone: firestoreData.clientPhone,
        clientEmail: firestoreData.clientEmail,
      };
    } catch (error) {
      console.error('Error mapping appointment data:', error);
      throw new Error('Failed to map appointment data');
    }
  }

  // Helper method to get service by ID
  private static async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      const serviceDoc = await getDoc(doc(db, this.SERVICES_COLLECTION, serviceId));
      
      if (serviceDoc.exists()) {
        const serviceData = serviceDoc.data() as FirestoreService;
        return {
          id: serviceDoc.id,
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          category: serviceData.category,
          isActive: serviceData.isActive,
          createdAt: serviceData.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: serviceData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  }

  // Helper method to get stylist by ID
  private static async getStylistById(stylistId: string): Promise<Stylist | null> {
    try {
      const stylistDoc = await getDoc(doc(db, this.STYLISTS_COLLECTION, stylistId));
      
      if (stylistDoc.exists()) {
        const stylistData = stylistDoc.data() as FirestoreStylist;
        return {
          id: stylistDoc.id,
          firstName: stylistData.firstName,
          lastName: stylistData.lastName,
          email: stylistData.email,
          phone: stylistData.phone,
          specialization: stylistData.specialization || [],
          experience: stylistData.experience || 0,
          rating: stylistData.rating || 0,
          totalClients: stylistData.totalClients || 0,
          totalEarnings: stylistData.totalEarnings || 0,
          isAvailable: stylistData.isAvailable ?? true,
          workingHours: stylistData.workingHours || {},
          services: stylistData.services || [],
          createdAt: stylistData.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: stylistData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching stylist:', error);
      return null;
    }
  }

  // Helper method to get branch by ID
  private static async getBranchById(branchId: string): Promise<Branch | null> {
    try {
      const branchDoc = await getDoc(doc(db, this.BRANCHES_COLLECTION, branchId));
      
      if (branchDoc.exists()) {
        const branchData = branchDoc.data() as FirestoreBranch;
        return {
          id: branchDoc.id,
          name: branchData.name,
          address: branchData.address,
          phone: branchData.phone,
          email: branchData.email,
          managerId: branchData.managerId,
          isActive: branchData.isActive ?? true,
          createdAt: branchData.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: branchData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching branch:', error);
      return null;
    }
  }

  // Format time for display (12-hour format with AM/PM)
  static formatTime(timeString: string | undefined | null): string {
    if (!timeString) {
      return 'N/A';
    }
    
    try {
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0] || '0', 10);
      const minutes = parseInt(timeParts[1] || '0', 10);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return 'Invalid Time';
      }
      
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error, 'timeString:', timeString);
      return 'Invalid Time';
    }
  }

  // Format date for display
  static formatDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'dateString:', dateString);
      return 'Invalid Date';
    }
  }

  // Get status color for UI
  static getStatusColor(status: string): string {
    console.log('🎨 getStatusColor called with status:', status, 'type:', typeof status);
    
    // Handle null/undefined status
    if (!status) {
      console.log('❌ Status is null/undefined for color');
      return '#9E9E9E';
    }
    
    // Normalize status (trim whitespace and convert to lowercase for comparison)
    const normalizedStatus = status.toString().trim().toLowerCase();
    console.log('🎨 Normalized status for color:', normalizedStatus);
    
    switch (normalizedStatus) {
      case 'scheduled':
        console.log('✅ Returning yellow for scheduled');
        return '#FFC107'; // Yellow
      case 'confirmed':
        return '#4CAF50'; // Green
      case 'completed':
        return '#2196F3'; // Blue
      case 'pending_reschedule':
        return '#FF9800'; // Orange
      case 'pending':
        return '#FF9800';
      case 'in_progress':
        return '#9C27B0';
      case 'cancelled':
        return '#F44336';
      case 'no_show':
        return '#795548';
      default:
        console.log('❌ Unknown status for color:', status, 'normalized:', normalizedStatus);
        return '#9E9E9E';
    }
  }

  // Get status text for display
  static getStatusText(status: string): string {
    console.log('🔍 getStatusText called with status:', status, 'type:', typeof status);
    
    // Handle null/undefined status
    if (!status) {
      console.log('❌ Status is null/undefined');
      return 'Unknown';
    }
    
    // Normalize status (trim whitespace and convert to lowercase for comparison)
    const normalizedStatus = status.toString().trim().toLowerCase();
    console.log('🔍 Normalized status:', normalizedStatus);
    
    switch (normalizedStatus) {
      case 'scheduled':
        console.log('✅ Returning Scheduled');
        return 'Scheduled';
      case 'confirmed':
        return 'Confirmed';
      case 'pending_reschedule':
        return 'Pending Reschedule';
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        console.log('❌ Unknown status:', status, 'normalized:', normalizedStatus);
        return 'Unknown';
    }
  }
}

export default AppointmentService;