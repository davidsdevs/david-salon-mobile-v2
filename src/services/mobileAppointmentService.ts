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
        if (!data.archived) { // Only active services
          branchServices.push({
            id: doc.id,
            name: data.name || 'Unknown Service',
            category: data.category || 'General',
            duration: data.duration || 30,
            price: data.price || 0,
            description: data.description || '',
            isActive: data.isActive !== false,
            branchId: data.branchId,
          });
        }
      });
      
      console.log('✅ Found branch-specific services:', branchServices.length);
      
      // If no branch-specific services, fallback to global services
      if (branchServices.length === 0) {
        console.log('🔄 No branch-specific services, fetching global services...');
        const globalServicesQuery = query(servicesRef);
        const globalServicesSnapshot = await getDocs(globalServicesQuery);
        const globalServices: Service[] = [];
        
        globalServicesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.archived) { // Only active services
            globalServices.push({
              id: doc.id,
              name: data.name || 'Unknown Service',
              category: data.category || 'General',
              duration: data.duration || 30,
              price: data.price || 0,
              description: data.description || '',
              isActive: data.isActive !== false,
              branchId: data.branchId,
            });
          }
        });
        
        console.log('✅ Found global services:', globalServices.length);
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
      
      // Get all services and staff services in parallel
      const [allServices, staffServices] = await Promise.all([
        this.getServicesByBranch(branchId),
        this.getStaffServicesByBranch(branchId)
      ]);
      
      console.log('📊 All services count:', allServices.length);
      console.log('📊 Staff services count:', staffServices.length);
      console.log('📊 Staff services data:', staffServices);
      
      // If no staff services, return all services (fallback)
      if (staffServices.length === 0) {
        console.log('⚠️ No staff services found, returning all services');
        return allServices;
      }
      
      // Filter services based on what staff can actually provide
      const allowedServiceIds = new Set(staffServices.map(ss => ss.serviceId));
      console.log('📊 Allowed service IDs:', Array.from(allowedServiceIds));
      
      const availableServices = allServices.filter(service => {
        const isAllowed = allowedServiceIds.has(service.id);
        console.log(`📊 Service ${service.name} (${service.id}): ${isAllowed ? 'ALLOWED' : 'FILTERED OUT'}`);
        return isAllowed;
      });
      
      console.log('✅ Found available services:', availableServices.length);
      return availableServices;
    } catch (error) {
      console.error('❌ Error fetching available services:', error);
      throw new Error('Failed to fetch available services');
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
  async createAppointment(appointmentData: AppointmentData): Promise<string> {
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
        updatedAt: serverTimestamp(),
        status: appointmentData.status || 'confirmed'
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
