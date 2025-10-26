import emailjs from '@emailjs/react-native';

// EmailJS configuration
// You'll need to set up an account at https://www.emailjs.com/
// and replace these with your actual credentials
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Replace with your EmailJS template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with your EmailJS public key

export interface EmailNotificationData {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  from_name?: string;
}

export class EmailNotificationService {
  // Initialize EmailJS
  static initialize() {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  // Send email notification
  static async sendEmail(emailData: EmailNotificationData): Promise<boolean> {
    try {
      console.log('📧 Sending email to:', emailData.to_email);
      
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: emailData.to_email,
          to_name: emailData.to_name,
          subject: emailData.subject,
          message: emailData.message,
          from_name: emailData.from_name || 'David Salon',
        }
      );

      console.log('✅ Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  // Send appointment cancellation email to stylist
  static async notifyStylistOfCancellation(
    stylistEmail: string,
    stylistName: string,
    clientName: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<boolean> {
    return await this.sendEmail({
      to_email: stylistEmail,
      to_name: stylistName,
      subject: 'Appointment Cancelled',
      message: `Dear ${stylistName},\n\n${clientName} has cancelled their ${serviceName} appointment scheduled for ${appointmentDate} at ${appointmentTime}.\n\nPlease update your schedule accordingly.\n\nBest regards,\nDavid Salon`,
    });
  }

  // Send new appointment email to stylist
  static async notifyStylistOfNewAppointment(
    stylistEmail: string,
    stylistName: string,
    clientName: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<boolean> {
    return await this.sendEmail({
      to_email: stylistEmail,
      to_name: stylistName,
      subject: 'New Appointment Booked',
      message: `Dear ${stylistName},\n\nYou have a new appointment!\n\nClient: ${clientName}\nService: ${serviceName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\n\nPlease prepare for this appointment.\n\nBest regards,\nDavid Salon`,
    });
  }

  // Send appointment confirmation email to stylist
  static async notifyStylistOfConfirmation(
    stylistEmail: string,
    stylistName: string,
    clientName: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<boolean> {
    return await this.sendEmail({
      to_email: stylistEmail,
      to_name: stylistName,
      subject: 'Appointment Confirmed',
      message: `Dear ${stylistName},\n\n${clientName}'s ${serviceName} appointment has been confirmed.\n\nDate: ${appointmentDate}\nTime: ${appointmentTime}\n\nPlease be ready for this appointment.\n\nBest regards,\nDavid Salon`,
    });
  }

  // Send appointment reschedule email to stylist
  static async notifyStylistOfReschedule(
    stylistEmail: string,
    stylistName: string,
    clientName: string,
    oldDate: string,
    oldTime: string,
    newDate: string,
    newTime: string,
    serviceName: string
  ): Promise<boolean> {
    return await this.sendEmail({
      to_email: stylistEmail,
      to_name: stylistName,
      subject: 'Appointment Rescheduled',
      message: `Dear ${stylistName},\n\n${clientName} has rescheduled their ${serviceName} appointment.\n\nPrevious: ${oldDate} at ${oldTime}\nNew: ${newDate} at ${newTime}\n\nPlease update your schedule accordingly.\n\nBest regards,\nDavid Salon`,
    });
  }

  // Send appointment reminder email to stylist
  static async sendAppointmentReminder(
    stylistEmail: string,
    stylistName: string,
    clientName: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<boolean> {
    return await this.sendEmail({
      to_email: stylistEmail,
      to_name: stylistName,
      subject: 'Appointment Reminder',
      message: `Dear ${stylistName},\n\nThis is a reminder that you have an upcoming appointment:\n\nClient: ${clientName}\nService: ${serviceName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\n\nPlease be prepared.\n\nBest regards,\nDavid Salon`,
    });
  }
}
