import { PushNotificationService } from './pushNotificationService';
import { EmailNotificationService } from './emailNotificationService';
import { NotificationService } from './notificationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface StylistNotificationData {
  stylistId: string;
  stylistEmail: string;
  stylistName: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  serviceCount?: number;
  services?: Array<{ serviceName: string; servicePrice: number }>;
}

export class StylistNotificationService {
  /**
   * Send all types of notifications to stylist (Push + Email + In-app)
   */
  
  // Notify stylist of appointment cancellation
  static async notifyOfCancellation(data: StylistNotificationData): Promise<void> {
    try {
      console.log('📬 Sending cancellation notifications to stylist:', data.stylistName);

      // 1. Send local push notification
      await PushNotificationService.notifyStylistOfCancellation(
        data.clientName,
        data.appointmentDate,
        data.appointmentTime,
        data.serviceName
      );

      // 2. Send remote push notification
      try {
        const stylistDoc = await getDoc(doc(db, 'users', data.stylistId));
        if (stylistDoc.exists()) {
          const stylistData = stylistDoc.data();
          const pushToken = stylistData['pushToken'];
          
          if (pushToken) {
            await PushNotificationService.sendRemotePushNotification(
              pushToken,
              'Appointment Cancelled',
              `${data.clientName} has cancelled their ${data.serviceName} appointment on ${data.appointmentDate} at ${data.appointmentTime}.`,
              {
                type: 'appointment_cancelled',
                clientName: data.clientName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                serviceName: data.serviceName,
              }
            );
          }
        }
      } catch (pushError) {
        console.error('⚠️ Failed to send remote push notification:', pushError);
      }

      // 3. Send email notification
      await EmailNotificationService.notifyStylistOfCancellation(
        data.stylistEmail,
        data.stylistName,
        data.clientName,
        data.appointmentDate,
        data.appointmentTime,
        data.serviceName
      );

      // 4. Create in-app notification
      await NotificationService.createNotification({
        recipientId: data.stylistId,
        recipientRole: 'stylist',
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `${data.clientName} has cancelled their ${data.serviceName} appointment on ${data.appointmentDate} at ${data.appointmentTime}.`,
        data: {
          clientName: data.clientName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          serviceName: data.serviceName,
        },
      });

      console.log('✅ All cancellation notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending cancellation notifications:', error);
      throw error;
    }
  }

  // Notify stylist of new appointment
  static async notifyOfNewAppointment(data: StylistNotificationData): Promise<void> {
    try {
      console.log('📬 Sending new appointment notifications to stylist:', data.stylistName);

      // Format service text based on count
      const serviceText = data.serviceCount && data.serviceCount > 1 
        ? `${data.serviceCount} services` 
        : data.serviceName;

      // 1. Send local push notification (for when app is open)
      await PushNotificationService.notifyStylistOfNewAppointment(
        data.clientName,
        data.appointmentDate,
        data.appointmentTime,
        serviceText
      );

      // 2. Send remote push notification (for when app is closed)
      try {
        const stylistDoc = await getDoc(doc(db, 'users', data.stylistId));
        if (stylistDoc.exists()) {
          const stylistData = stylistDoc.data();
          const pushToken = stylistData['pushToken'];
          
          if (pushToken) {
            await PushNotificationService.sendRemotePushNotification(
              pushToken,
              'New Appointment',
              `${data.clientName} has booked ${serviceText} on ${data.appointmentDate} at ${data.appointmentTime}.`,
              {
                type: 'appointment_new',
                clientName: data.clientName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                serviceName: serviceText,
                serviceCount: data.serviceCount,
              }
            );
            console.log('✅ Remote push notification sent to:', data.stylistName);
          } else {
            console.log('⚠️ No push token found for stylist:', data.stylistName);
          }
        }
      } catch (pushError) {
        console.error('⚠️ Failed to send remote push notification:', pushError);
        // Don't throw - continue with other notifications
      }

      // 3. Send email notification
      await EmailNotificationService.notifyStylistOfNewAppointment(
        data.stylistEmail,
        data.stylistName,
        data.clientName,
        data.appointmentDate,
        data.appointmentTime,
        serviceText
      );

      // 4. Create in-app notification
      await NotificationService.createNotification({
        recipientId: data.stylistId,
        recipientRole: 'stylist',
        type: 'appointment_confirmed',
        title: 'New Appointment',
        message: `${data.clientName} has booked ${serviceText} on ${data.appointmentDate} at ${data.appointmentTime}.`,
        data: {
          clientName: data.clientName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          serviceName: serviceText,
          serviceCount: data.serviceCount,
          services: data.services,
        },
      });

      console.log('✅ All new appointment notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending new appointment notifications:', error);
      throw error;
    }
  }

  // Notify stylist of appointment confirmation
  static async notifyOfConfirmation(data: StylistNotificationData): Promise<void> {
    try {
      console.log('📬 Sending confirmation notifications to stylist:', data.stylistName);

      // 1. Send local push notification
      await PushNotificationService.notifyStylistOfConfirmation(
        data.clientName,
        data.appointmentDate,
        data.appointmentTime,
        data.serviceName
      );

      // 2. Send remote push notification
      try {
        const stylistDoc = await getDoc(doc(db, 'users', data.stylistId));
        if (stylistDoc.exists()) {
          const stylistData = stylistDoc.data();
          const pushToken = stylistData['pushToken'];
          
          if (pushToken) {
            await PushNotificationService.sendRemotePushNotification(
              pushToken,
              'Appointment Confirmed',
              `${data.clientName}'s ${data.serviceName} appointment on ${data.appointmentDate} at ${data.appointmentTime} has been confirmed.`,
              {
                type: 'appointment_confirmed',
                clientName: data.clientName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                serviceName: data.serviceName,
              }
            );
          }
        }
      } catch (pushError) {
        console.error('⚠️ Failed to send remote push notification:', pushError);
      }

      // 3. Send email notification
      await EmailNotificationService.notifyStylistOfConfirmation(
        data.stylistEmail,
        data.stylistName,
        data.clientName,
        data.appointmentDate,
        data.appointmentTime,
        data.serviceName
      );

      // 4. Create in-app notification
      await NotificationService.createNotification({
        recipientId: data.stylistId,
        recipientRole: 'stylist',
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `${data.clientName}'s ${data.serviceName} appointment on ${data.appointmentDate} at ${data.appointmentTime} has been confirmed.`,
        data: {
          clientName: data.clientName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          serviceName: data.serviceName,
        },
      });

      console.log('✅ All confirmation notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending confirmation notifications:', error);
      throw error;
    }
  }

  // Notify stylist of appointment reschedule
  static async notifyOfReschedule(
    data: StylistNotificationData & {
      oldDate: string;
      oldTime: string;
      newDate: string;
      newTime: string;
    }
  ): Promise<void> {
    try {
      console.log('📬 Sending reschedule notifications to stylist:', data.stylistName);

      // 1. Send local push notification
      await PushNotificationService.notifyStylistOfReschedule(
        data.clientName,
        data.oldDate,
        data.oldTime,
        data.newDate,
        data.newTime,
        data.serviceName
      );

      // 2. Send remote push notification
      try {
        const stylistDoc = await getDoc(doc(db, 'users', data.stylistId));
        if (stylistDoc.exists()) {
          const stylistData = stylistDoc.data();
          const pushToken = stylistData['pushToken'];
          
          if (pushToken) {
            await PushNotificationService.sendRemotePushNotification(
              pushToken,
              'Appointment Rescheduled',
              `${data.clientName} has rescheduled their ${data.serviceName} appointment from ${data.oldDate} at ${data.oldTime} to ${data.newDate} at ${data.newTime}.`,
              {
                type: 'appointment_rescheduled',
                clientName: data.clientName,
                oldDate: data.oldDate,
                oldTime: data.oldTime,
                newDate: data.newDate,
                newTime: data.newTime,
                serviceName: data.serviceName,
              }
            );
          }
        }
      } catch (pushError) {
        console.error('⚠️ Failed to send remote push notification:', pushError);
      }

      // 3. Send email notification
      await EmailNotificationService.notifyStylistOfReschedule(
        data.stylistEmail,
        data.stylistName,
        data.clientName,
        data.oldDate,
        data.oldTime,
        data.newDate,
        data.newTime,
        data.serviceName
      );

      // 4. Create in-app notification
      await NotificationService.createNotification({
        recipientId: data.stylistId,
        recipientRole: 'stylist',
        type: 'appointment_rescheduled',
        title: 'Appointment Rescheduled',
        message: `${data.clientName} has rescheduled their ${data.serviceName} appointment from ${data.oldDate} at ${data.oldTime} to ${data.newDate} at ${data.newTime}.`,
        data: {
          clientName: data.clientName,
          oldDate: data.oldDate,
          oldTime: data.oldTime,
          newDate: data.newDate,
          newTime: data.newTime,
          serviceName: data.serviceName,
        },
      });

      console.log('✅ All reschedule notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending reschedule notifications:', error);
      throw error;
    }
  }

  // Send appointment reminder
  static async sendAppointmentReminder(data: StylistNotificationData): Promise<void> {
    try {
      console.log('📬 Sending appointment reminder to stylist:', data.stylistName);

      // 1. Send remote push notification
      try {
        const stylistDoc = await getDoc(doc(db, 'users', data.stylistId));
        if (stylistDoc.exists()) {
          const stylistData = stylistDoc.data();
          const pushToken = stylistData['pushToken'];
          
          if (pushToken) {
            await PushNotificationService.sendRemotePushNotification(
              pushToken,
              'Appointment Reminder',
              `Reminder: ${data.clientName}'s ${data.serviceName} appointment is scheduled for ${data.appointmentDate} at ${data.appointmentTime}.`,
              {
                type: 'appointment_reminder',
                clientName: data.clientName,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                serviceName: data.serviceName,
              }
            );
          }
        }
      } catch (pushError) {
        console.error('⚠️ Failed to send remote push notification:', pushError);
      }

      // 2. Send email notification
      await EmailNotificationService.sendAppointmentReminder(
        data.stylistEmail,
        data.stylistName,
        data.clientName,
        data.appointmentDate,
        data.appointmentTime,
        data.serviceName
      );

      // 3. Create in-app notification
      await NotificationService.createNotification({
        recipientId: data.stylistId,
        recipientRole: 'stylist',
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        message: `Reminder: ${data.clientName}'s ${data.serviceName} appointment is scheduled for ${data.appointmentDate} at ${data.appointmentTime}.`,
        data: {
          clientName: data.clientName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          serviceName: data.serviceName,
        },
      });

      console.log('✅ Appointment reminder sent successfully');
    } catch (error) {
      console.error('❌ Error sending appointment reminder:', error);
      throw error;
    }
  }

  // Notify stylist of new walk-in client
  static async notifyOfWalkInClient(data: {
    stylistId: string;
    stylistEmail: string;
    stylistName: string;
    clientName: string;
    services: Array<{ serviceName: string; servicePrice: number }>;
    totalAmount: number;
  }): Promise<void> {
    try {
      console.log('📬 Sending walk-in client notifications to stylist:', data.stylistName);

      const serviceText = data.services.length > 1 
        ? `${data.services.length} services` 
        : data.services[0]?.serviceName || 'service';

      const serviceList = data.services.map(s => s.serviceName).join(', ');

      // 1. Send local push notification
      await PushNotificationService.sendLocalNotification({
        title: 'New Walk-in Client',
        body: `${data.clientName} is here for ${serviceText}. Total: ₱${data.totalAmount.toFixed(2)}`,
        data: {
          type: 'walk_in_client',
          clientName: data.clientName,
          services: data.services,
          totalAmount: data.totalAmount,
        }
      });

      // 2. Send remote push notification
      try {
        const stylistDoc = await getDoc(doc(db, 'users', data.stylistId));
        if (stylistDoc.exists()) {
          const stylistData = stylistDoc.data();
          const pushToken = stylistData['pushToken'];
          
          if (pushToken) {
            await PushNotificationService.sendRemotePushNotification(
              pushToken,
              'New Walk-in Client',
              `${data.clientName} is here for ${serviceText}. Total: ₱${data.totalAmount.toFixed(2)}`,
              {
                type: 'walk_in_client',
                clientName: data.clientName,
                services: data.services,
                totalAmount: data.totalAmount,
              }
            );
          }
        }
      } catch (pushError) {
        console.error('⚠️ Failed to send remote push notification:', pushError);
      }

      // 3. Send email notification
      await EmailNotificationService.sendEmail({
        to_email: data.stylistEmail,
        to_name: data.stylistName,
        subject: 'New Walk-in Client',
        message: `
          <h2>New Walk-in Client</h2>
          <p>Hi ${data.stylistName},</p>
          <p><strong>${data.clientName}</strong> has arrived for the following services:</p>
          <ul>
            ${data.services.map(s => `<li>${s.serviceName} - ₱${s.servicePrice.toFixed(2)}</li>`).join('')}
          </ul>
          <p><strong>Total Amount:</strong> ₱${data.totalAmount.toFixed(2)}</p>
          <p>Please prepare to serve this client.</p>
        `
      });

      // 4. Create in-app notification
      await NotificationService.createNotification({
        recipientId: data.stylistId,
        recipientRole: 'stylist',
        type: 'walk_in_client',
        title: 'New Walk-in Client',
        message: `${data.clientName} is here for ${serviceList}. Total: ₱${data.totalAmount.toFixed(2)}`,
        data: {
          clientName: data.clientName,
          services: data.services,
          totalAmount: data.totalAmount,
        },
      });

      console.log('✅ All walk-in client notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending walk-in client notifications:', error);
      throw error;
    }
  }

  // Notify stylist when transaction is paid
  static async notifyOfTransactionPaid(data: {
    stylistId: string;
    stylistEmail: string;
    stylistName: string;
    clientName: string;
    services: Array<{ serviceName: string; servicePrice: number }>;
    totalAmount: number;
    commission: number;
    paymentMethod: string;
    transactionId: string;
  }): Promise<void> {
    try {
      console.log('📬 Sending transaction paid notifications to stylist:', data.stylistName);

      const serviceText = data.services.length > 1 
        ? `${data.services.length} services` 
        : data.services[0]?.serviceName || 'service';

      const serviceList = data.services.map(s => s.serviceName).join(', ');

      // 1. Send local push notification
      await PushNotificationService.sendLocalNotification({
        title: 'Payment Received',
        body: `${data.clientName} paid ₱${data.totalAmount.toFixed(2)}. Your commission: ₱${data.commission.toFixed(2)}`,
        data: {
          type: 'transaction_paid',
          clientName: data.clientName,
          services: data.services,
          totalAmount: data.totalAmount,
          commission: data.commission,
        }
      });

      // 2. Send remote push notification
      try {
        const stylistDoc = await getDoc(doc(db, 'users', data.stylistId));
        if (stylistDoc.exists()) {
          const stylistData = stylistDoc.data();
          const pushToken = stylistData['pushToken'];
          
          if (pushToken) {
            await PushNotificationService.sendRemotePushNotification(
              pushToken,
              'Payment Received',
              `${data.clientName} paid ₱${data.totalAmount.toFixed(2)} for ${serviceText}. Your commission: ₱${data.commission.toFixed(2)}`,
              {
                type: 'transaction_paid',
                clientName: data.clientName,
                services: data.services,
                totalAmount: data.totalAmount,
                commission: data.commission,
                paymentMethod: data.paymentMethod,
                transactionId: data.transactionId,
              }
            );
          }
        }
      } catch (pushError) {
        console.error('⚠️ Failed to send remote push notification:', pushError);
      }

      // 3. Send email notification
      await EmailNotificationService.sendEmail({
        to_email: data.stylistEmail,
        to_name: data.stylistName,
        subject: 'Payment Received',
        message: `
          <h2>Payment Received</h2>
          <p>Hi ${data.stylistName},</p>
          <p><strong>${data.clientName}</strong> has completed payment for:</p>
          <ul>
            ${data.services.map(s => `<li>${s.serviceName} - ₱${s.servicePrice.toFixed(2)}</li>`).join('')}
          </ul>
          <p><strong>Total Amount:</strong> ₱${data.totalAmount.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p><strong>Your Commission (60%):</strong> ₱${data.commission.toFixed(2)}</p>
          <p>Transaction ID: ${data.transactionId}</p>
        `
      });

      // 4. Create in-app notification
      await NotificationService.createNotification({
        recipientId: data.stylistId,
        recipientRole: 'stylist',
        type: 'transaction_paid',
        title: 'Payment Received',
        message: `${data.clientName} paid ₱${data.totalAmount.toFixed(2)} for ${serviceList}. Your commission: ₱${data.commission.toFixed(2)}`,
        data: {
          clientName: data.clientName,
          services: data.services,
          totalAmount: data.totalAmount,
          commission: data.commission,
          paymentMethod: data.paymentMethod,
          transactionId: data.transactionId,
        },
      });

      console.log('✅ All transaction paid notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending transaction paid notifications:', error);
      throw error;
    }
  }
}
