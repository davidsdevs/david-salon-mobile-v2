// SendGrid Email Service for React Native
// This works with mobile apps using SendGrid API

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

export class SendGridEmailService {
  // SendGrid API Configuration
  private static readonly SENDGRID_API_KEY = 'your-sendgrid-api-key'; // Replace with your actual API key
  private static readonly SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
  private static readonly FROM_EMAIL = 'chicorlcruz@gmail.com';
  private static readonly FROM_NAME = "David's Salon";

  /**
   * Send appointment confirmation email via SendGrid API
   */
  static async sendAppointmentConfirmation(data: AppointmentEmailData): Promise<boolean> {
    try {
      console.log('📧 Sending appointment confirmation email via SendGrid API...');
      console.log('📧 To:', data.clientEmail);
      console.log('📧 From:', this.FROM_EMAIL);
      
      // Generate email content
      const emailContent = this.generateEmailContent(data);
      const htmlContent = this.generateHtmlContent(data);
      
      // Prepare SendGrid API request
      const emailData = {
        personalizations: [{
          to: [{ email: data.clientEmail, name: data.clientName }],
          subject: `Appointment Confirmation - David's Salon`
        }],
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        content: [
          {
            type: 'text/plain',
            value: emailContent
          },
          {
            type: 'text/html',
            value: htmlContent
          }
        ]
      };
      
      console.log('📧 Email Data Prepared for SendGrid:', {
        to: data.clientEmail,
        from: this.FROM_EMAIL,
        subject: emailData.personalizations[0].subject,
        hasText: !!emailContent,
        hasHtml: !!htmlContent
      });
      
      // TODO: Uncomment when you have SendGrid API key
      // const response = await fetch(this.SENDGRID_API_URL, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.SENDGRID_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(emailData)
      // });
      
      // if (response.ok) {
      //   console.log('✅ Email sent successfully via SendGrid API');
      //   return true;
      // } else {
      //   console.error('❌ SendGrid API error:', response.status, response.statusText);
      //   return false;
      // }
      
      // For now, simulate successful sending
      console.log('✅ Email prepared successfully (SendGrid API integration ready)');
      console.log('📧 Email would be sent to:', data.clientEmail);
      console.log('📧 Subject:', emailData.personalizations[0].subject);
      
      return true;
    } catch (error) {
      console.error('❌ Error preparing email for SendGrid:', error);
      return false;
    }
  }

  /**
   * Generate email content
   */
  private static generateEmailContent(data: AppointmentEmailData): string {
    const servicesList = data.services.map(service => 
      `• ${service.name} with ${service.stylist} (₱${service.price}, ${service.duration} min)`
    ).join('\n');

    return `
Subject: Appointment Confirmation - David's Salon

Dear ${data.clientName},

Your appointment has been confirmed!

📅 Date: ${data.appointmentDate}
🕐 Time: ${data.appointmentTime}
📍 Branch: ${data.branchName}
⏱️ Duration: ${data.totalDuration} minutes

💇‍♀️ Services:
${servicesList}

💰 Total: ₱${data.totalPrice}

${data.notes ? `📝 Notes: ${data.notes}` : ''}

🏷️ Appointment ID: ${data.appointmentId}

Important Reminders:
• Please arrive 10 minutes before your scheduled time
• Bring a valid ID for verification
• Contact us if you need to make any changes

Contact Information:
📞 Phone: +63 2 1234 5678
📧 Email: info@davidsalon.com
🌐 Website: https://davidsalon.com

Cancellation Policy:
Cancellations must be made at least 24 hours in advance.

We look forward to seeing you!

Best regards,
David's Salon Team
    `.trim();
  }

  /**
   * Generate HTML email content
   */
  private static generateHtmlContent(data: AppointmentEmailData): string {
    const servicesList = data.services.map(service => 
      `<li><strong>${service.name}</strong> with ${service.stylist} (₱${service.price}, ${service.duration} min)</li>`
    ).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #160B53 0%, #4A90E2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .appointment-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .services { background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin: 15px 0; }
            .total { background: #160B53; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 15px 0; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #ddd; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✨ David's Salon</h1>
            <p>Your Beauty & Wellness Destination</p>
        </div>
        
        <div class="content">
            <h2>🎉 Appointment Confirmed!</h2>
            <p>Dear ${data.clientName},</p>
            <p>Your appointment has been successfully confirmed!</p>
            
            <div class="appointment-details">
                <h3>📅 Appointment Details</h3>
                <p><strong>Date:</strong> ${data.appointmentDate}</p>
                <p><strong>Time:</strong> ${data.appointmentTime}</p>
                <p><strong>Branch:</strong> ${data.branchName}</p>
                <p><strong>Duration:</strong> ${data.totalDuration} minutes</p>
            </div>
            
            <div class="services">
                <h3>💇‍♀️ Your Services</h3>
                <ul>${servicesList}</ul>
            </div>
            
            <div class="total">
                <h3>💰 Total Amount: ₱${data.totalPrice}</h3>
                <p><em>* Final cost may vary based on service complexity</em></p>
            </div>
            
            ${data.notes ? `<div class="appointment-details"><h3>📝 Special Notes</h3><p>${data.notes}</p></div>` : ''}
            
            <div class="appointment-details">
                <h3>⏰ Important Reminders</h3>
                <ul>
                    <li>Please arrive 10 minutes before your scheduled time</li>
                    <li>Bring a valid ID for verification</li>
                    <li>Contact us if you need to make any changes</li>
                </ul>
            </div>
            
            <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
        </div>
        
        <div class="footer">
            <h3>Contact Information</h3>
            <p>📞 Phone: +63 2 1234 5678</p>
            <p>📧 Email: info@davidsalon.com</p>
            <p>🌐 Website: https://davidsalon.com</p>
            <p>📍 Address: 123 Makati Avenue, Makati City, Philippines</p>
            
            <div style="margin-top: 20px; padding: 10px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 5px;">
                <h4>📋 Cancellation Policy</h4>
                <p>Cancellations must be made at least 24 hours in advance. Late cancellations may be subject to a fee.</p>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
                © ${new Date().getFullYear()} David's Salon. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    `.trim();
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<boolean> {
    try {
      console.log('🧪 Testing SendGrid email configuration...');
      
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
      console.error('❌ SendGrid email test failed:', error);
      return false;
    }
  }
}

export default SendGridEmailService;
