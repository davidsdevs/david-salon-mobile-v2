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
import { NotificationService } from './notificationService';
import { StylistNotificationService } from './stylistNotificationService';

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

  // Get all appointments for a stylist
  static async getStylistAppointments(stylistId: string): Promise<Appointment[]> {
    try {
      console.log('🔍 Fetching appointments for stylistId:', stylistId);
      const appointmentsRef = collection(db, this.COLLECTION_NAME);

      // Try multiple schemas/fields that may store stylist ownership
      const queries = [
        query(appointmentsRef, where('stylistId', '==', stylistId)),
        query(appointmentsRef, where('assignedStylistId', '==', stylistId)),
        query(appointmentsRef, where('createdBy', '==', stylistId)),
        // Some datasets denormalize stylist IDs for array-contains queries
        query(appointmentsRef, where('serviceStylistPairsStylistIds', 'array-contains', stylistId)),
        // Try looking for stylist in serviceStylistPairs array
        query(appointmentsRef, where('serviceStylistPairs', 'array-contains', stylistId)),
      ];

      console.log('🔍 Trying queries for stylistId:', stylistId);
      const allAppointments: Appointment[] = [];

      for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        const queryNames = ['stylistId', 'assignedStylistId', 'createdBy', 'serviceStylistPairsStylistIds', 'serviceStylistPairs'];
        try {
          console.log(`🔍 Executing stylist query ${i + 1} (${queryNames[i]})...`);
          const snapshot = await getDocs(q);
          console.log(`📊 Query ${queryNames[i]} returned`, snapshot.docs.length, 'documents');

          for (const docSnapshot of snapshot.docs) {
            try {
              const appointmentData = docSnapshot.data() as FirestoreAppointment;
              const appointment = await this.mapFirestoreToAppointment(appointmentData, docSnapshot.id);
              allAppointments.push(appointment);
            } catch (mappingError) {
              console.error('❌ Error mapping stylist appointment:', docSnapshot.id, mappingError);
            }
          }
        } catch (queryError) {
          console.log('⚠️ Stylist query failed, trying next:', queryError);
        }
      }

      // Fallback: scan a reasonable subset if no results yet, and filter client-side
      if (allAppointments.length === 0) {
        try {
          console.log('🔄 No stylist-specific results; performing fallback scan to filter client-side');
          const snapshot = await getDocs(appointmentsRef);
          console.log('📊 Fallback scan size:', snapshot.size);
          for (const docSnapshot of snapshot.docs) {
            try {
              const data = docSnapshot.data() as FirestoreAppointment & { stylists?: Array<{ id?: string; stylistId?: string }>; };

              const hasDirectStylist = (data as any).stylistId === stylistId || (data as any).assignedStylistId === stylistId;

              const hasPairStylist = Array.isArray(data.serviceStylistPairs)
                && data.serviceStylistPairs.some((p: any) => p && (p.stylistId === stylistId || p.uid === stylistId));

              const hasStylistsArray = Array.isArray((data as any).stylists)
                && (data as any).stylists.some((s: any) => s && (s.id === stylistId || s.stylistId === stylistId));

              if (hasDirectStylist || hasPairStylist || hasStylistsArray) {
                const appointment = await this.mapFirestoreToAppointment(data, docSnapshot.id);
                allAppointments.push(appointment);
              }
            } catch (mappingError) {
              console.error('❌ Error mapping stylist appointment (fallback):', docSnapshot.id, mappingError);
            }
          }
        } catch (scanError) {
          console.log('⚠️ Fallback scan failed:', scanError);
        }
      }

      console.log('📊 Total stylist appointments found (pre-dedupe):', allAppointments.length);

      // Remove duplicates based on appointment ID
      const uniqueAppointments = allAppointments.filter((appointment, index, self) =>
        index === self.findIndex(a => a.id === appointment.id)
      );

      console.log('📊 Unique stylist appointments after deduplication:', uniqueAppointments.length);

      // Sort client-side by date desc then time desc
      const sortedAppointments = uniqueAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate || a.date);
        const dateB = new Date(b.appointmentDate || b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        const timeA = a.appointmentTime || a.startTime || '';
        const timeB = b.appointmentTime || b.startTime || '';
        return timeB.localeCompare(timeA);
      });

      console.log('✅ Returning', sortedAppointments.length, 'stylist appointments');
      return sortedAppointments;
    } catch (error) {
      console.error('❌ Error fetching stylist appointments:', error);
      throw new Error('Failed to fetch stylist appointments');
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
      
      // Get current appointment data before update
      const appointmentDoc = await getDoc(appointmentRef);
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }
      
      const appointmentData = appointmentDoc.data() as FirestoreAppointment;
      const oldStatus = appointmentData.status;
      const newStatus = updates.status;
      
      // Update appointment
      await updateDoc(appointmentRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      // Send notifications if status changed to in-service or completed
      if (newStatus && newStatus !== oldStatus && (newStatus === 'in-service' || newStatus === 'in_progress' || newStatus === 'completed')) {
        try {
          // Get stylist ID from serviceStylistPairs or direct stylistId
          let stylistId = appointmentData.stylistId;
          if (!stylistId && (appointmentData as any).serviceStylistPairs && (appointmentData as any).serviceStylistPairs.length > 0) {
            stylistId = (appointmentData as any).serviceStylistPairs[0].stylistId;
          }
          
          if (stylistId) {
            // Get stylist information
            const stylistDoc = await getDoc(doc(db, 'users', stylistId));
            let stylistEmail = 'stylist@example.com';
            let stylistName = 'Stylist';
            
            if (stylistDoc.exists()) {
              const stylistData = stylistDoc.data();
              stylistEmail = stylistData['email'] || stylistEmail;
              stylistName = `${stylistData['firstName'] || ''} ${stylistData['lastName'] || ''}`.trim() || stylistName;
            }
            
            // Get client name
            const clientName = (appointmentData as any).clientName || 
                              `${(appointmentData as any).clientFirstName || ''} ${(appointmentData as any).clientLastName || ''}`.trim() ||
                              'Client';
            
            // Get service name
            let serviceName = 'Service';
            if ((appointmentData as any).services && (appointmentData as any).services.length > 0) {
              serviceName = (appointmentData as any).services[0].name;
            } else if (appointmentData.service) {
              serviceName = appointmentData.service;
            }
            
            // Get date and time
            const appointmentDate = (appointmentData as any).appointmentDate || appointmentData.date || 'Unknown date';
            const appointmentTime = (appointmentData as any).appointmentTime || appointmentData.startTime || 'Unknown time';
            
            // Create notification based on status
            const isInService = newStatus === 'in-service' || newStatus === 'in_progress';
            const notificationData = {
              recipientId: stylistId,
              recipientRole: 'stylist' as const,
              type: isInService ? 'general' as const : 'appointment_confirmed' as const,
              title: isInService ? 'Appointment In Service' : 'Appointment Completed',
              message: isInService
                ? `${clientName}'s ${serviceName} appointment is now in service.`
                : `${clientName}'s ${serviceName} appointment on ${appointmentDate} at ${appointmentTime} has been completed.`,
              data: {
                clientName,
                appointmentDate,
                appointmentTime,
                serviceName,
                appointmentId,
                status: newStatus,
              },
            };
            
            await NotificationService.createNotification(notificationData);
            console.log(`✅ Notification sent for status change to ${newStatus}`);
          }
        } catch (notificationError) {
          console.error('⚠️ Failed to send notification for status change:', notificationError);
        }
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment');
    }
  }

  // Cancel appointment
  static async cancelAppointment(appointmentId: string, reason: string): Promise<void> {
    try {
      console.log('🔄 Cancelling appointment:', appointmentId);
      
      // Get appointment details first to notify stylist
      const appointmentDoc = await getDoc(doc(db, this.COLLECTION_NAME, appointmentId));
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }
      
      const appointmentData = appointmentDoc.data() as FirestoreAppointment;
      
      // Update appointment status
      const appointmentRef = doc(db, this.COLLECTION_NAME, appointmentId);
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: Timestamp.now(),
      });
      
      console.log('✅ Appointment cancelled');
      
      // Notify stylist about cancellation (Push + Email + In-app)
      try {
        // Get stylist ID from serviceStylistPairs or direct stylistId
        let stylistId = appointmentData.stylistId;
        if (!stylistId && (appointmentData as any).serviceStylistPairs && (appointmentData as any).serviceStylistPairs.length > 0) {
          stylistId = (appointmentData as any).serviceStylistPairs[0].stylistId;
        }
        
        if (stylistId) {
          // Get stylist information from Firebase
          const stylistDoc = await getDoc(doc(db, 'users', stylistId));
          let stylistEmail = 'stylist@example.com';
          let stylistName = 'Stylist';
          
          if (stylistDoc.exists()) {
            const stylistData = stylistDoc.data();
            stylistEmail = stylistData['email'] || stylistEmail;
            stylistName = `${stylistData['firstName'] || ''} ${stylistData['lastName'] || ''}`.trim() || stylistName;
          }
          
          // Get client name
          const clientName = (appointmentData as any).clientName || 
                            `${(appointmentData as any).clientFirstName || ''} ${(appointmentData as any).clientLastName || ''}`.trim() ||
                            'Client';
          
          // Get service name
          let serviceName = 'Service';
          if ((appointmentData as any).services && (appointmentData as any).services.length > 0) {
            serviceName = (appointmentData as any).services[0].name;
          } else if (appointmentData.service) {
            serviceName = appointmentData.service;
          }
          
          // Get date and time
          const appointmentDate = (appointmentData as any).appointmentDate || appointmentData.date || 'Unknown date';
          const appointmentTime = (appointmentData as any).appointmentTime || appointmentData.startTime || 'Unknown time';
          
          // Send all notifications (Push + Email + In-app)
          await StylistNotificationService.notifyOfCancellation({
            stylistId,
            stylistEmail,
            stylistName,
            clientName,
            appointmentDate,
            appointmentTime,
            serviceName,
          });
          
          console.log('✅ Stylist notified of cancellation (Push + Email + In-app)');
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send notification, but appointment was cancelled:', notificationError);
        // Don't throw error - appointment is already cancelled
      }
    } catch (error) {
      console.error('❌ Error cancelling appointment:', error);
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

  // Subscribe to real-time updates for stylist appointments
  static subscribeToStylistAppointments(
    stylistId: string,
    callback: (appointments: Appointment[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time subscription for stylistId:', stylistId);
    const appointmentsRef = collection(db, this.COLLECTION_NAME);
    
    // Create a query for stylist appointments
    // Note: This uses the primary stylistId field. If your data structure is different,
    // you may need to adjust this query or use multiple subscriptions
    const q = query(
      appointmentsRef,
      where('stylistId', '==', stylistId)
    );

    return onSnapshot(q, async (snapshot) => {
      console.log('📡 Real-time snapshot received for stylist:', snapshot.docs.length, 'documents');
      const appointments: Appointment[] = [];

      // Process all documents from the primary query
      for (const docSnapshot of snapshot.docs) {
        try {
          console.log('🔄 Processing real-time document:', docSnapshot.id);
          const appointmentData = docSnapshot.data() as FirestoreAppointment;
          const appointment = await this.mapFirestoreToAppointment(appointmentData, docSnapshot.id);
          appointments.push(appointment);
        } catch (error) {
          console.error('❌ Error processing real-time stylist appointment:', docSnapshot.id, error);
        }
      }

      // Also check for appointments where stylist is in serviceStylistPairs
      // This is a fallback for appointments that may not have stylistId field
      try {
        const allAppointmentsQuery = query(appointmentsRef);
        const allSnapshot = await getDocs(allAppointmentsQuery);
        
        for (const docSnapshot of allSnapshot.docs) {
          // Skip if already processed
          if (appointments.some(apt => apt.id === docSnapshot.id)) {
            continue;
          }

          try {
            const data = docSnapshot.data() as FirestoreAppointment & { stylists?: Array<{ id?: string; stylistId?: string }>; };

            const hasDirectStylist = (data as any).assignedStylistId === stylistId;

            const hasPairStylist = Array.isArray(data.serviceStylistPairs)
              && data.serviceStylistPairs.some((p: any) => p && (p.stylistId === stylistId || p.uid === stylistId));

            const hasStylistsArray = Array.isArray((data as any).stylists)
              && (data as any).stylists.some((s: any) => s && (s.id === stylistId || s.stylistId === stylistId));

            if (hasDirectStylist || hasPairStylist || hasStylistsArray) {
              const appointment = await this.mapFirestoreToAppointment(data, docSnapshot.id);
              appointments.push(appointment);
            }
          } catch (mappingError) {
            console.error('❌ Error mapping stylist appointment (fallback):', docSnapshot.id, mappingError);
          }
        }
      } catch (fallbackError) {
        console.log('⚠️ Fallback query for stylist appointments failed:', fallbackError);
      }

      // Remove duplicates based on appointment ID
      const uniqueAppointments = appointments.filter((appointment, index, self) =>
        index === self.findIndex(a => a.id === appointment.id)
      );

      // Sort client-side to avoid composite index requirement
      const sortedAppointments = uniqueAppointments.sort((a, b) => {
        // Use new date fields with fallbacks
        const dateA = new Date(a.appointmentDate || a.date);
        const dateB = new Date(b.appointmentDate || b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        // If dates are equal, sort by time (descending)
        const timeA = a.appointmentTime || a.startTime || '';
        const timeB = b.appointmentTime || b.startTime || '';
        return timeB.localeCompare(timeA);
      });

      console.log('✅ Real-time callback with', sortedAppointments.length, 'stylist appointments');
      callback(sortedAppointments);
    }, (error) => {
      console.error('❌ Error in real-time stylist appointment subscription:', error);
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

      // Get primary stylist and service from serviceStylistPairs first
      let primaryStylistId = '';
      let primaryServiceId = '';
      
      if (firestoreData.serviceStylistPairs && firestoreData.serviceStylistPairs.length > 0) {
        const firstPair = firestoreData.serviceStylistPairs[0];
        primaryStylistId = firstPair.stylistId;
        primaryServiceId = firstPair.serviceId;
      }

      // Try to get stylist name from users collection using serviceStylistPairs
      let stylistName = 'Stylist Name';
      let stylistFirstName = 'Stylist';
      let stylistLastName = 'Name';
      
      if (primaryStylistId) {
        try {
          // Fetch from users collection using the stylistId (which is the uid)
          const userDoc = await getDoc(doc(db, 'users', primaryStylistId));
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
      
      // Fetch service data
      let serviceData = null;
      if (primaryServiceId) {
        try {
          serviceData = await this.getServiceById(primaryServiceId);
          console.log('✅ Found service:', serviceData?.name, 'Price:', serviceData?.price);
        } catch (error) {
          console.log('⚠️ Could not fetch service:', error);
        }
      }
      
      // Fetch branch data
      let branchData = null;
      let branchName = '';
      if (firestoreData.branchId) {
        try {
          branchData = await this.getBranchById(firestoreData.branchId);
          branchName = branchData?.name || '';
          console.log('✅ Found branch:', branchName);
        } catch (error) {
          console.log('⚠️ Could not fetch branch:', error);
        }
      }
      
      // Fetch client details (phone, email, allergies)
      let clientPhone = '';
      let clientEmail = '';
      let clientAllergies = '';
      let clientFirstName = '';
      let clientLastName = '';
      let clientFullName = '';
      
      if (firestoreData.clientId) {
        try {
          const clientDoc = await getDoc(doc(db, 'users', firestoreData.clientId));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            clientFirstName = clientData.firstName || '';
            clientLastName = clientData.lastName || '';
            clientFullName = `${clientFirstName} ${clientLastName}`.trim();
            clientPhone = clientData.phone || clientData.phoneNumber || '';
            clientEmail = clientData.email || '';
            clientAllergies = clientData.allergies || clientData.specialNotes || '';
            console.log('✅ Found client details:', clientFullName, clientPhone);
          }
        } catch (error) {
          console.log('⚠️ Could not fetch client details:', error);
        }
      }
      
      let stylistData = null;

      console.log('🔄 Fetched related data:', {
        service: serviceData ? { id: serviceData.id, name: serviceData.name, price: serviceData.price, duration: serviceData.duration } : null,
        stylist: stylistData ? { id: stylistData.id, name: `${stylistData.firstName} ${stylistData.lastName}` } : null,
        branch: branchData ? { id: branchData.id, name: branchData.name } : null
      });

      // Handle different data structures from web vs mobile
      const appointmentDate = firestoreData.appointmentDate || firestoreData.date || firestoreData.scheduledDate;
      const appointmentTime = firestoreData.appointmentTime || firestoreData.time || firestoreData.startTime;
      
      // Get first service and stylist from arrays (receptionist structure)
      const firstService = firestoreData.services && firestoreData.services.length > 0 ? firestoreData.services[0] : null;
      const firstStylist = firestoreData.stylists && firestoreData.stylists.length > 0 ? firestoreData.stylists[0] : null;
      
      // Calculate total cost from services array or fetched service data
      let totalCost = 0;
      if (firestoreData.services && firestoreData.services.length > 0) {
        // Use services array if available (receptionist structure)
        totalCost = firestoreData.services.reduce((sum: number, service: any) => sum + (service.price || service.servicePrice || 0), 0);
        console.log('💰 Price from services array:', totalCost);
      } else if ((firestoreData as any).serviceStylistPairs && (firestoreData as any).serviceStylistPairs.length > 0) {
        // Use serviceStylistPairs array (new structure)
        totalCost = (firestoreData as any).serviceStylistPairs.reduce((sum: number, pair: any) => sum + (pair.servicePrice || 0), 0);
        console.log('💰 Price from serviceStylistPairs:', totalCost);
      } else if ((firestoreData as any).totalPrice) {
        // Use totalPrice field
        totalCost = (firestoreData as any).totalPrice;
        console.log('💰 Price from totalPrice field:', totalCost);
      } else if (serviceData?.price) {
        // Use fetched service price if available
        totalCost = serviceData.price;
        console.log('💰 Price from fetched service:', totalCost);
      } else {
        // Fallback to stored price
        totalCost = firestoreData.totalCost || firestoreData.price || 0;
        console.log('💰 Price from stored data:', totalCost, { totalCost: firestoreData.totalCost, price: firestoreData.price });
      }
      
      console.log('💰 Final calculated price:', totalCost, 'for appointment:', docId);

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
        duration: serviceData?.duration || firstService?.duration || 60, // Use service duration if available
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
        clientName: clientFullName || firestoreData.clientInfo?.clientName || firestoreData.clientName,
        clientFirstName: clientFirstName,
        clientLastName: clientLastName,
        clientPhone: clientPhone,
        clientEmail: clientEmail,
        allergies: clientAllergies,
        branchName: branchName,
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