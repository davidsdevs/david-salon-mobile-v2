import emailjs from '@emailjs/react-native';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_david_devs';
const EMAILJS_TEMPLATE_ID = 'template_j6ktzo1';
const EMAILJS_PUBLIC_KEY = 'nuqGoYtoFwXuCTNpv';

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

export class EmailService {
  /**
   * Send appointment confirmation email
   */
  static async sendAppointmentConfirmation(data: AppointmentEmailData): Promise<boolean> {
    try {
      console.log('📧 Sending appointment confirmation email to:', data.clientEmail);
      
      // Prepare email template parameters
      const templateParams = {
        to_email: data.clientEmail,
        to_name: data.clientName,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        branch_name: data.branchName,
        services_list: this.formatServicesList(data.services),
        total_price: `₱${data.totalPrice}`,
        total_duration: `${data.totalDuration} minutes`,
        notes: data.notes || 'No additional notes',
        appointment_id: data.appointmentId,
        salon_name: "David's Salon",
        salon_phone: "+63 2 1234 5678",
        salon_email: "info@davidsalon.com",
        salon_address: "123 Makati Avenue, Makati City, Philippines",
        confirmation_message: "Your appointment has been successfully confirmed!",
        reminder_message: "Please arrive 10 minutes before your scheduled time.",
        cancellation_policy: "Cancellations must be made at least 24 hours in advance.",
        website_url: "https://davidsalon.com",
        current_year: new Date().getFullYear()
      };

      // Send email
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: EMAILJS_PUBLIC_KEY
        }
      );

      console.log('✅ Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  /**
   * Format services list for email template
   */
  private static formatServicesList(services: Array<{
    name: string;
    stylist: string;
    price: number;
    duration: number;
  }>): string {
    return services.map(service => 
      `• ${service.name} with ${service.stylist} (₱${service.price}, ${service.duration} min)`
    ).join('\n');
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<boolean> {
    try {
      console.log('🧪 Testing EmailJS configuration...');
      console.log('📧 Service ID:', EMAILJS_SERVICE_ID);
      console.log('📧 Template ID:', EMAILJS_TEMPLATE_ID);
      console.log('📧 Public Key:', EMAILJS_PUBLIC_KEY);
      
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
      console.error('❌ Email configuration test failed:', error);
      return false;
    }
  }
}

export default EmailService;
