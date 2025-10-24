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
}
