import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { StylistNotificationService } from './stylistNotificationService';

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

export interface Stylist {
  id: string;
  name: string;
  email: string;
  specialties?: string[];
  rating?: number;
  avatar?: string;
}

export interface AppointmentData {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  branchId: string;
  branchName: string;
  serviceId: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

class MobileAppointmentService {
  static async createAppointment(appointmentData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('✅ Appointment created with ID:', docRef.id);
      
      // Send notifications to stylist(s)
      try {
        // Check if this is a multi-service appointment with serviceStylistPairs
        if (appointmentData.serviceStylistPairs && Array.isArray(appointmentData.serviceStylistPairs)) {
          // Get unique stylist IDs from serviceStylistPairs
          const uniqueStylistIds = [...new Set(
            appointmentData.serviceStylistPairs
              .map((pair: any) => pair.stylistId)
              .filter((id: string) => id)
          )];
          
          console.log('📬 Notifying stylists:', uniqueStylistIds);
          
          // Notify each unique stylist
          for (const stylistId of uniqueStylistIds) {
            try {
              // Get stylist information from Firebase
              const stylistDoc = await getDoc(doc(db, 'users', String(stylistId)));
              let stylistEmail = 'stylist@example.com';
              let stylistName = 'Stylist';
              
              if (stylistDoc.exists()) {
                const stylistData = stylistDoc.data();
                stylistEmail = stylistData['email'] || stylistEmail;
                stylistName = `${stylistData['firstName'] || ''} ${stylistData['lastName'] || ''}`.trim() || stylistName;
              }
              
              // Get services for this stylist
              const stylistServicePairs = appointmentData.serviceStylistPairs
                .filter((pair: any) => pair.stylistId === stylistId);
              
              const serviceCount = stylistServicePairs.length;
              const serviceName = serviceCount === 1 
                ? stylistServicePairs[0].serviceName 
                : `${serviceCount} services`;
              
              const services = stylistServicePairs.map((pair: any) => ({
                serviceName: pair.serviceName,
                servicePrice: pair.servicePrice
              }));
              
              await StylistNotificationService.notifyOfNewAppointment({
                stylistId: String(stylistId),
                stylistEmail: stylistEmail,
                stylistName: stylistName,
                clientName: appointmentData.clientName,
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
                serviceName: serviceName,
                serviceCount: serviceCount,
                services: services,
              });
              
              console.log(`✅ Notified stylist ${stylistName} (${stylistId})`);
            } catch (stylistError) {
              console.error(`⚠️ Failed to notify stylist ${stylistId}:`, stylistError);
            }
          }
        } else if (appointmentData.stylistId) {
          // Fallback for single-stylist appointments
          const stylistDoc = await getDoc(doc(db, 'users', appointmentData.stylistId));
          let stylistEmail = 'stylist@example.com';
          let stylistName = appointmentData.stylistName;
          
          if (stylistDoc.exists()) {
            const stylistData = stylistDoc.data();
            stylistEmail = stylistData['email'] || stylistEmail;
            stylistName = `${stylistData['firstName'] || ''} ${stylistData['lastName'] || ''}`.trim() || stylistName;
          }
          
          await StylistNotificationService.notifyOfNewAppointment({
            stylistId: appointmentData.stylistId,
            stylistEmail: stylistEmail,
            stylistName: stylistName,
            clientName: appointmentData.clientName,
            appointmentDate: appointmentData.appointmentDate,
            appointmentTime: appointmentData.appointmentTime,
            serviceName: appointmentData.serviceName,
          });
          
          console.log('✅ Stylist notified of new appointment');
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send notification, but appointment was created:', notificationError);
        // Don't throw - appointment is already created
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  static async getServices(): Promise<Service[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Service));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  static async getStylists(): Promise<Stylist[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'stylists'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Stylist));
    } catch (error) {
      console.error('Error fetching stylists:', error);
      throw error;
    }
  }

  static async getBranches(): Promise<any[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'branches'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }
}

export default MobileAppointmentService;


