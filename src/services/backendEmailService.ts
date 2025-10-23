// Backend Email Service using your Gmail SMTP
// This calls a backend API that uses Nodemailer

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

export class BackendEmailService {
  // Backend API endpoint (run backend-server.js)
  private static readonly BACKEND_API_URL = 'http://localhost:3001/send-email';
  
  // Your Gmail SMTP credentials
  private static readonly SMTP_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'chicorlcruz@gmail.com',
      pass: 'kflf nqdl mbfq opqv'
    }
  };

  /**
   * Send appointment confirmation email via backend API
   */
  static async sendAppointmentConfirmation(data: AppointmentEmailData): Promise<boolean> {
    try {
      console.log('📧 Sending appointment confirmation email via backend API...');
      console.log('📧 To:', data.clientEmail);
      console.log('📧 From:', this.SMTP_CONFIG.auth.user);
      
      // Generate email content
      const emailContent = this.generateEmailContent(data);
      const htmlContent = this.generateHtmlContent(data);
      
      // Prepare email data for backend
      const emailData = {
        smtp: this.SMTP_CONFIG,
        email: {
          from: `"David's Salon" <${this.SMTP_CONFIG.auth.user}>`,
          to: data.clientEmail,
          subject: `Appointment Confirmation - David's Salon`,
          text: emailContent,
          html: htmlContent
        }
      };
      
      console.log('📧 Email Data Prepared:', {
        to: emailData.email.to,
        from: emailData.email.from,
        subject: emailData.email.subject,
        hasText: !!emailData.email.text,
        hasHtml: !!emailData.email.html
      });
      
      // Call backend API to send email using Nodemailer
      console.log('📧 Sending to backend API:', this.BACKEND_API_URL);
      
      const response = await fetch(this.BACKEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully via backend:', result.messageId);
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Backend API error:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error preparing email for backend:', error);
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
      console.log('🧪 Testing backend email configuration...');
      
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
      console.error('❌ Backend email test failed:', error);
      return false;
    }
  }
}

export default BackendEmailService;
