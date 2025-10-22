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

  // Get all appointments for a stylist
  static async getStylistAppointments(stylistId: string): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      const q = query(appointmentsRef, where('stylistId', '==', stylistId));
      
      const snapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const appointmentData = docSnapshot.data() as FirestoreAppointment;
        const appointment = await this.mapFirestoreToAppointment(appointmentData, docSnapshot.id);
        appointments.push(appointment);
      }

      // Sort by date and time (descending)
      return appointments.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        return b.startTime.localeCompare(a.startTime);
      });
    } catch (error) {
      console.error('Error fetching stylist appointments:', error);
      throw new Error('Failed to fetch stylist appointments');
    }
  }

  // Get all appointments for a client
  static async getClientAppointments(clientId: string): Promise<Appointment[]> {
    try {
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
          const snapshot = await getDocs(q);
          for (const docSnapshot of snapshot.docs) {
            const appointmentData = docSnapshot.data() as FirestoreAppointment;
            const appointment = await this.mapFirestoreToAppointment(appointmentData, docSnapshot.id);
            allAppointments.push(appointment);
          }
        } catch (error) {
          // Continue with other queries if one fails
          console.log('Query failed, trying next:', error);
        }
      }

      // Remove duplicates based on appointment ID
      const uniqueAppointments = allAppointments.filter((appointment, index, self) => 
        index === self.findIndex(a => a.id === appointment.id)
      );

      // Sort client-side to avoid composite index requirement
      return uniqueAppointments.sort((a, b) => {
        // First sort by date (descending)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        // If dates are equal, sort by startTime (descending)
        return b.startTime.localeCompare(a.startTime);
      });
    } catch (error) {
      console.error('Error fetching client appointments:', error);
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
    newStartTime: string, 
    newEndTime: string
  ): Promise<void> {
    try {
      const appointmentRef = doc(db, this.COLLECTION_NAME, appointmentId);
      await updateDoc(appointmentRef, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw new Error('Failed to reschedule appointment');
    }
  }

  // Subscribe to real-time updates for client appointments
  static subscribeToClientAppointments(
    clientId: string,
    callback: (appointments: Appointment[]) => void
  ): () => void {
    const appointmentsRef = collection(db, this.COLLECTION_NAME);
    
    // Try clientId first (receptionist structure)
    const q = query(
      appointmentsRef,
      where('clientId', '==', clientId)
    );

    return onSnapshot(q, async (snapshot) => {
      const appointments: Appointment[] = [];

      for (const docSnapshot of snapshot.docs) {
        const appointmentData = docSnapshot.data() as FirestoreAppointment;
        const appointment = await this.mapFirestoreToAppointment(appointmentData, docSnapshot.id);
        appointments.push(appointment);
      }

      // Sort client-side to avoid composite index requirement
      const sortedAppointments = appointments.sort((a, b) => {
        // First sort by date (descending)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        // If dates are equal, sort by startTime (descending)
        return b.startTime.localeCompare(a.startTime);
      });

      callback(sortedAppointments);
    }, (error) => {
      console.error('Error in appointment subscription:', error);
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

      // Fetch related data in parallel
      const [serviceData, stylistData, branchData] = await Promise.all([
        firestoreData.serviceId ? this.getServiceById(firestoreData.serviceId) : null,
        firestoreData.stylistId ? this.getStylistById(firestoreData.stylistId) : null,
        firestoreData.branchId ? this.getBranchById(firestoreData.branchId) : null,
      ]);

      console.log('🔄 Fetched related data:', {
        service: serviceData ? { id: serviceData.id, name: serviceData.name } : null,
        stylist: stylistData ? { id: stylistData.id, name: `${stylistData.firstName} ${stylistData.lastName}` } : null,
        branch: branchData ? { id: branchData.id, name: branchData.name } : null
      });

      // Handle different data structures from web vs mobile
      const appointmentDate = firestoreData.date || firestoreData.appointmentDate || firestoreData.scheduledDate;
      const appointmentTime = firestoreData.time || firestoreData.startTime;
      
      // Get first service and stylist from arrays (receptionist structure)
      const firstService = firestoreData.services && firestoreData.services.length > 0 ? firestoreData.services[0] : null;
      const firstStylist = firestoreData.stylists && firestoreData.stylists.length > 0 ? firestoreData.stylists[0] : null;
      
      // Calculate total cost from services array
      const totalCost = firestoreData.services ? 
        firestoreData.services.reduce((sum, service) => sum + (service.price || 0), 0) : 
        (firestoreData.totalCost || firestoreData.price || 0);

      return {
        id: docId,
        clientId: firestoreData.clientId,
        stylistId: firstStylist?.stylistId || firestoreData.stylistId,
        serviceId: firstService?.id || firestoreData.serviceId,
        branchId: firestoreData.branchId,
        date: appointmentDate,
        startTime: appointmentTime,
        endTime: firestoreData.endTime,
        duration: firstService?.duration || firestoreData.duration,
        status: firestoreData.status,
        notes: firestoreData.notes,
        clientNotes: firestoreData.clientNotes,
        stylistNotes: firestoreData.stylistNotes,
        price: totalCost,
        discount: firestoreData.discount,
        finalPrice: firestoreData.finalPrice || totalCost,
        paymentStatus: firestoreData.paymentStatus,
        paymentMethod: firestoreData.paymentMethod,
        createdAt: firestoreData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: firestoreData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
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
        stylist: stylistData || (firstStylist ? {
          id: firstStylist.stylistId,
          firstName: firstStylist.stylistName?.split(' ')[0] || 'Unknown',
          lastName: firstStylist.stylistName?.split(' ').slice(1).join(' ') || 'Stylist',
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
        } : undefined),
        branch: branchData || undefined,
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
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'in_progress':
        return '#9C27B0';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      case 'no_show':
        return '#795548';
      default:
        return '#9E9E9E';
    }
  }

  // Get status text for display
  static getStatusText(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
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
        return 'Unknown';
    }
  }
}

export default AppointmentService;