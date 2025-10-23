import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../config/firebase';

// Types
export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  isActive: boolean;
  isChemical?: boolean;
  branchId?: string;
}

export interface Stylist {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  specialties: string[];
  serviceIds: string[]; // Add serviceIds like receptionist
  phone: string;
  email: string;
  rating: number;
  isAvailable: boolean;
  branchId?: string;
}

export interface AppointmentData {
  clientId: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    category: string;
  }>;
  stylists: Array<{
    serviceId: string;
    serviceName: string;
    stylistId: string;
    stylistName: string;
  }>;
  date: string;
  time: string;
  totalCost: number;
  notes?: string;
  status: string;
  branchId: string;
  createdBy: string;
}

class MobileAppointmentService {
  // Helper function to normalize service_id to array format
  private static normalizeServiceIds(serviceId: any): string[] {
    if (!serviceId) return [];
    
    if (Array.isArray(serviceId)) {
      return serviceId;
    }
    
    if (typeof serviceId === 'string') {
      // Handle comma-separated strings or single service
      return serviceId.includes(',') 
        ? serviceId.split(',').map(id => id.trim())
        : [serviceId];
    }
    
    console.warn('⚠️ Invalid service_id format:', serviceId);
    return [];
  }
  // Get all branches
  async getBranches(): Promise<Branch[]> {
    try {
      console.log('🔄 Fetching branches...');
      const branchesRef = collection(db, COLLECTIONS.BRANCHES);
      const querySnapshot = await getDocs(branchesRef);
      const branches: Branch[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        branches.push({
          id: doc.id,
          name: data.name || 'Unknown Branch',
          address: data.address || '',
          phone: data.phone || '',
          hours: data.hours || 'Mon-Sat: 9:00 AM - 8:00 PM',
          isActive: data.isActive !== false,
        });
      });
      
      console.log('✅ Found branches:', branches.length);
      return branches;
    } catch (error) {
      console.error('❌ Error fetching branches:', error);
      throw new Error('Failed to fetch branches');
    }
  }

  // Get staff services for a branch
  async getStaffServicesByBranch(branchId: string): Promise<any[]> {
    try {
      console.log('🔄 Fetching staff services for branch:', branchId);
      const staffServicesRef = collection(db, 'staff_services');
      const q = query(staffServicesRef, where('branchId', '==', branchId));
      const querySnapshot = await getDocs(q);
      const staffServices: any[] = [];
      
      querySnapshot.forEach((doc) => {
        staffServices.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log('✅ Found staff services:', staffServices.length);
      return staffServices;
    } catch (error) {
      console.error('❌ Error fetching staff services:', error);
      return [];
    }
  }

  // Get services by branch (following receptionist pattern)
  async getServicesByBranch(branchId: string): Promise<Service[]> {
    try {
      console.log('🔄 Fetching services for branch:', branchId);
      
      // First try to get branch-specific services
      const servicesRef = collection(db, COLLECTIONS.SERVICES);
      const branchServicesQuery = query(servicesRef, where('branchId', '==', branchId));
      const branchServicesSnapshot = await getDocs(branchServicesQuery);
      const branchServices: Service[] = [];
      
      branchServicesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`🔍 COMPLETE RAW DATA for ${data.name}:`, data);
        if (!data.archived) { // Only active services
          console.log(`🔍 Raw database data for ${data.name}:`, {
            isChemical: data.isChemical,
            isChemicalType: typeof data.isChemical,
            isChemica1: data.isChemica1,
            allFields: Object.keys(data)
          });
          
          branchServices.push({
            id: doc.id,
            name: data.name || 'Unknown Service',
            category: data.category || 'General',
            duration: data.duration || 30,
            price: data.price || 0,
            description: data.description || '',
            isActive: data.isActive !== false,
            isChemical: data.isChemical || data.isChemica1 || false,
            branchId: data.branchId,
          });
        }
      });
      
      console.log('✅ Found branch-specific services:', branchServices.length);
      console.log('🔍 Branch services data:', branchServices);
      
      // If no branch-specific services, fallback to global services
      if (branchServices.length === 0) {
        console.log('🔄 No branch-specific services, fetching global services...');
        const globalServicesQuery = query(servicesRef);
        const globalServicesSnapshot = await getDocs(globalServicesQuery);
        const globalServices: Service[] = [];
        
        globalServicesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.archived) { // Only active services
            console.log(`🔍 Raw GLOBAL database data for ${data.name}:`, {
              isChemical: data.isChemical,
              isChemicalType: typeof data.isChemical,
              isChemica1: data.isChemica1,
              allFields: Object.keys(data)
            });
            
            globalServices.push({
              id: doc.id,
              name: data.name || 'Unknown Service',
              category: data.category || 'General',
              duration: data.duration || 30,
              price: data.price || 0,
              description: data.description || '',
              isActive: data.isActive !== false,
              isChemical: data.isChemical || data.isChemica1 || false,
              branchId: data.branchId,
            });
          }
        });
        
        console.log('✅ Found global services:', globalServices.length);
        console.log('🔍 Global services data:', globalServices);
        return globalServices;
      }
      
      return branchServices;
    } catch (error) {
      console.error('❌ Error fetching services:', error);
      throw new Error('Failed to fetch services');
    }
  }

  // Get available services for a branch (filtered by staff services)
  async getAvailableServicesByBranch(branchId: string): Promise<Service[]> {
    try {
      console.log('🔄 Fetching available services for branch:', branchId);
      
      // Get all services and filter by branch availability
      const servicesRef = collection(db, COLLECTIONS.SERVICES);
      const q = query(servicesRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const availableServices: Service[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log('🔍 Processing service:', {
          docId: doc.id,
          serviceName: data.name,
          branches: data.branches,
          targetBranchId: branchId,
          isAvailableAtBranch: data.branches && data.branches.includes(branchId)
        });
        
        // Check if this service is available at the selected branch
        if (data.branches && data.branches.includes(branchId)) {
          const service = {
            id: doc.id,
            name: data.name,
            category: data.category,
            duration: data.duration,
            price: data.prices && data.prices.length > 0 ? data.prices[0] : 0, // Use first price
            description: data.description,
            isActive: data.isActive,
            isChemical: data.isChemical || data.isChemica1 || false,
            branchId: branchId
          };
          console.log('✅ Adding service:', service);
          availableServices.push(service);
        }
      });
      
      console.log('✅ Found available services for branch:', availableServices.length);
      console.log('📋 Available services:', availableServices);
      return availableServices;
    } catch (error) {
      console.error('❌ Error fetching available services:', error);
      throw new Error('Failed to fetch available services');
    }
  }

  // Get stylists who can perform a specific service at a specific branch
  async getStylistsByServiceAndBranch(serviceId: string, branchId: string): Promise<Stylist[]> {
    try {
      console.log('🔄 Fetching stylists for service:', serviceId, 'at branch:', branchId);
      console.log('🔍 Service ID details:', {
        serviceId,
        serviceIdType: typeof serviceId,
        serviceIdLength: serviceId.length,
        serviceIdTrimmed: serviceId.trim()
      });
      
      // Query users collection for stylists at this branch who can perform this service
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where('branchId', '==', branchId),
        where('isActive', '==', true),
        where('roles', 'array-contains', 'stylist')
      );
      
      const querySnapshot = await getDocs(q);
      const availableStylists: Stylist[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        
        console.log('🔍 Processing stylist data:', {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          service_id: data.service_id,
          service_id_type: typeof data.service_id,
          isArray: Array.isArray(data.service_id)
        });
        
        // Normalize service_id to array format
        const serviceIds = MobileAppointmentService.normalizeServiceIds(data.service_id);
        
        if (serviceIds.length === 0) {
          console.log('⚠️ Skipping stylist due to empty service_id:', `${data.firstName} ${data.lastName}`);
          return; // Skip this stylist
        }
        
        console.log('✅ Normalized service IDs for', `${data.firstName} ${data.lastName}:`, serviceIds);
        
        // Check if this stylist can perform the selected service
        // Create a more robust matching function
        const canPerformService = (stylistServiceIds: string[], requestedServiceId: string): boolean => {
          if (stylistServiceIds.length === 0) return false;
          
          // Direct match
          if (stylistServiceIds.includes(requestedServiceId)) {
            return true;
          }
          
          // Try different matching strategies
          const normalizedRequested = requestedServiceId.toLowerCase().trim();
          
          for (const stylistServiceId of stylistServiceIds) {
            const normalizedStylist = stylistServiceId.toLowerCase().trim();
            
            // Direct normalized match
            if (normalizedStylist === normalizedRequested) {
              return true;
            }
            
            // Check if one contains the other (for cases like "service_facial" vs "facial")
            if (normalizedStylist.includes(normalizedRequested) || normalizedRequested.includes(normalizedStylist)) {
              return true;
            }
            
            // Check for common service type patterns
            const requestedType = normalizedRequested.replace(/^service_/, '').replace(/^service/, '');
            const stylistType = normalizedStylist.replace(/^service_/, '').replace(/^service/, '');
            
            if (requestedType === stylistType) {
              return true;
            }
          }
          
          return false;
        };
        
        const canPerform = canPerformService(serviceIds, serviceId);
        
        console.log('🔍 Checking if stylist can perform service:', {
          stylistName: `${data.firstName} ${data.lastName}`,
          serviceIds: serviceIds,
          requestedServiceId: serviceId,
          canPerform: canPerform,
          directMatch: serviceIds.includes(serviceId)
        });
        
        if (canPerform) {
          console.log('✅ Adding stylist to available list:', `${data.firstName} ${data.lastName}`);
          availableStylists.push({
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            specialties: serviceIds,
            serviceIds: serviceIds,
            phone: data.phone || '',
            email: data.email || '',
            rating: 4.5, // Default rating
            isAvailable: true,
            branchId: branchId
          });
        } else {
          console.log('❌ Stylist cannot perform this service:', `${data.firstName} ${data.lastName}`);
        }
      });
      
      console.log('✅ Found stylists for service:', availableStylists.length);
      console.log('📋 Available stylists:', availableStylists);
      
      // Additional debugging: Log all service IDs found in the database
      console.log('🔍 DEBUGGING: All service IDs found in database:');
      let arrayCount = 0;
      let stringCount = 0;
      let invalidCount = 0;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log('  - Stylist:', `${data.firstName} ${data.lastName}`, 'Service IDs:', data.service_id, 'Type:', typeof data.service_id, 'IsArray:', Array.isArray(data.service_id));
        
        if (Array.isArray(data.service_id)) {
          arrayCount++;
        } else if (typeof data.service_id === 'string') {
          stringCount++;
        } else {
          invalidCount++;
        }
      });
      
      console.log('📊 Data Structure Summary:');
      console.log(`  - Array format: ${arrayCount} stylists`);
      console.log(`  - String format: ${stringCount} stylists (legacy)`);
      console.log(`  - Invalid format: ${invalidCount} stylists`);
      console.log(`  - Total stylists: ${querySnapshot.size}`);
      
      return availableStylists;
    } catch (error) {
      console.error('❌ Error fetching stylists for service:', error);
      console.error('❌ Error details:', {
        serviceId,
        branchId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to fetch stylists for service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get stylists by branch (following receptionist pattern)
  async getStylistsByBranch(branchId: string): Promise<Stylist[]> {
    try {
      console.log('🔄 Fetching stylists for branch:', branchId);
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('role', '==', 'stylist'));
      const querySnapshot = await getDocs(q);
      const stylists: Stylist[] = [];
      
      console.log('🔍 Query snapshot size:', querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 Stylist data:', { 
          id: doc.id, 
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          staffData: data.staffData,
          branchId: data.staffData?.branchId,
          targetBranchId: branchId,
          match: data.staffData?.branchId === branchId
        });
        
        // Check if stylist belongs to the specified branch
        if (data.staffData && data.staffData.branchId === branchId) {
          console.log('✅ Match found for stylist:', data.firstName, data.lastName);
          stylists.push({
            id: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            specialties: data.staffData?.skills || [],
            serviceIds: data.staffData?.skills || [], // Add serviceIds like receptionist
            phone: data.phoneNumber || '',
            email: data.email || '',
            rating: data.staffData?.rating || 4.5, // Default rating like receptionist
            isAvailable: true, // Default to available like receptionist
            branchId: data.staffData?.branchId,
          });
        } else {
          console.log('❌ No match for stylist:', data.firstName, data.lastName, 'branchId:', data.staffData?.branchId, 'target:', branchId);
        }
      });
      
      console.log('🔍 Found stylists for branch:', stylists.length);
      console.log('🔍 Stylist names:', stylists.map(s => `${s.firstName} ${s.lastName}`));
      return stylists;
    } catch (error) {
      console.error('❌ Error fetching stylists:', error);
      throw new Error('Failed to fetch stylists');
    }
  }

  // Get all stylists (fallback method)
  async getAllStylists(): Promise<Stylist[]> {
    try {
      console.log('🔄 Fetching all stylists...');
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('role', '==', 'stylist'));
      const querySnapshot = await getDocs(q);
      const stylists: Stylist[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stylists.push({
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          specialties: data.staffData?.skills || [],
          serviceIds: data.staffData?.skills || [],
          phone: data.phoneNumber || '',
          email: data.email || '',
          rating: data.staffData?.rating || 4.5,
          isAvailable: true,
          branchId: data.staffData?.branchId,
        });
      });
      
      console.log('✅ Found all stylists:', stylists.length);
      return stylists;
    } catch (error) {
      console.error('❌ Error fetching all stylists:', error);
      throw new Error('Failed to fetch all stylists');
    }
  }

  // Get stylists for a specific service
  async getStylistsForService(serviceId: string, branchId: string): Promise<Stylist[]> {
    try {
      console.log('🔄 Fetching stylists for service:', serviceId, 'branch:', branchId);
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('role', '==', 'stylist'));
      const querySnapshot = await getDocs(q);
      const stylists: Stylist[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Check if stylist belongs to the specified branch and has the service skill
        if (data.staffData && 
            data.staffData.branchId === branchId && 
            data.staffData.skills && 
            data.staffData.skills.includes(serviceId)) {
          stylists.push({
            id: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            specialties: data.staffData?.skills || [],
            serviceIds: data.staffData?.skills || [],
            phone: data.phoneNumber || '',
            email: data.email || '',
            rating: data.staffData?.rating || 4.5,
            isAvailable: true,
            branchId: data.staffData?.branchId,
          });
        }
      });
      
      console.log('✅ Found stylists for service:', stylists.length);
      return stylists;
    } catch (error) {
      console.error('❌ Error fetching stylists for service:', error);
      throw new Error('Failed to fetch stylists for service');
    }
  }

  // Check time slot availability
  async checkTimeSlotAvailability(branchId: string, date: string, time: string): Promise<boolean> {
    try {
      console.log('🔄 Checking availability for:', { branchId, date, time });
      const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
      const q = query(
        appointmentsRef,
        where('branchId', '==', branchId),
        where('date', '==', date),
        where('time', '==', time),
        where('status', 'in', ['confirmed', 'in_service'])
      );
      
      const querySnapshot = await getDocs(q);
      const isAvailable = querySnapshot.empty;
      
      console.log('✅ Time slot available:', isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      return false;
    }
  }

  // Create appointment
  async createAppointment(appointmentData: any): Promise<string> {
    try {
      console.log('🔄 Creating appointment:', appointmentData);
      
      // Remove undefined fields (Firestore rejects undefined)
      const removeUndefinedFields = (obj: any) => Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        if (value !== undefined) acc[key] = value;
        return acc;
      }, {} as any);

      const appointment = removeUndefinedFields({
        ...appointmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
      const docRef = await addDoc(appointmentsRef, appointment);
      
      console.log('✅ Appointment created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  }

  // Get branch info
  async getBranchInfo(branchId: string): Promise<Branch | null> {
    try {
      console.log('🔄 Fetching branch info:', branchId);
      const branchRef = doc(db, COLLECTIONS.BRANCHES, branchId);
      const branchDoc = await getDoc(branchRef);
      
      if (branchDoc.exists()) {
        const data = branchDoc.data();
        return {
          id: branchDoc.id,
          name: data.name || 'Unknown Branch',
          address: data.address || '',
          phone: data.phone || '',
          hours: data.hours || 'Mon-Sat: 9:00 AM - 8:00 PM',
          isActive: data.isActive !== false,
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching branch info:', error);
      throw new Error('Failed to fetch branch info');
    }
  }
}

export default new MobileAppointmentService();
