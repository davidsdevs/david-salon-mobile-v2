import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { app } from '../config/firebase';

export interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  branchName: string;
  services: Array<{
    name: string;
    stylist: string;
    price: number;
    duration: number;
  }>;
  totalPrice: number;
  totalDuration: number;
  notes?: string;
  appointmentId: string;
}

export class FirebaseEmailService {
  /**
   * Send appointment confirmation email via Firebase Functions
   */
  static async sendAppointmentConfirmation(data: AppointmentEmailData): Promise<boolean> {
    try {
      console.log('📧 Sending appointment confirmation email via Firebase Functions...');
      
      // Initialize Firebase Functions
      const functions = getFunctions(app);
      
      // Call the email function
      const sendEmail = httpsCallable(functions, 'sendAppointmentEmail');
      
      const result = await sendEmail({
        toEmail: data.clientEmail,
        toName: data.clientName,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        branchName: data.branchName,
        services: data.services,
        totalPrice: data.totalPrice,
        totalDuration: data.totalDuration,
        notes: data.notes || '',
        appointmentId: data.appointmentId
      });

      console.log('✅ Email sent successfully via Firebase Functions:', result.data);
      return true;
    } catch (error) {
      console.error('❌ Error sending email via Firebase Functions:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<boolean> {
    try {
      console.log('🧪 Testing Firebase Functions email configuration...');
      
      const testData: AppointmentEmailData = {
        clientName: 'Test User',
        clientEmail: 'test@example.com',
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00 AM',
        branchName: "David's Salon - Makati",
        services: [{
          name: 'Haircut',
          stylist: 'John Doe',
          price: 500,
          duration: 60
        }],
        totalPrice: 500,
        totalDuration: 60,
        notes: 'Test appointment',
        appointmentId: 'TEST123'
      };

      const result = await this.sendAppointmentConfirmation(testData);
      console.log('🧪 Test result:', result ? '✅ SUCCESS' : '❌ FAILED');
      return result;
    } catch (error) {
      console.error('❌ Firebase Functions email test failed:', error);
      return false;
    }
  }
}

export default FirebaseEmailService;
