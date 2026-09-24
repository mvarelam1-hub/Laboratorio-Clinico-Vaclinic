import { PatientPushNotification, PushSubscriptionStatus } from '../types';
import { playNotificationChime } from '../utils/audioChime';

export const PUSH_NOTIFICATIONS_STORAGE_KEY = 'vaclinic_push_notifications_v1';
export const PUSH_PREFS_STORAGE_KEY = 'vaclinic_push_prefs_v1';

export class PushNotificationService {
  /**
   * Checks the current browser push notification permission status.
   */
  static getPermissionStatus(): PushSubscriptionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as PushSubscriptionStatus;
  }

  /**
   * Requests permission from the user for Web Push Notifications.
   */
  static async requestPermission(): Promise<PushSubscriptionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as PushSubscriptionStatus;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  /**
   * Dispatches a real browser Web Push notification (if granted) and plays audio chime.
   */
  static dispatchBrowserNotification(notification: PatientPushNotification): boolean {
    // Play medical sound chime
    playNotificationChime(notification.urgent ? 'urgent' : 'success');

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
          silent: false,
          requireInteraction: notification.urgent || false
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        return true;
      } catch (e) {
        console.warn('Browser push notification dispatch error:', e);
        return false;
      }
    }

    return false;
  }

  /**
   * Formats a direct WhatsApp notification link for the patient
   */
  static generateWhatsAppLink(phone: string, patientName: string, reportNumber: string, accessPin: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = `🔔 *VACLINIC Laboratorio Clínico - Resultados Listos*\n\nEstimado/a *${patientName}*:\nLe informamos que su informe médico *${reportNumber}* ya está validado y disponible para descarga digital.\n\n🔑 *Código PIN de Acceso:* ${accessPin}\n📍 *Sede:* Entrada de Pineda Oratorio Santa Rosa km 79.5\n📞 *Atención:* 56125563\n\nIngrese a nuestro portal para consultar sus resultados con interpretación clínica.`;
    return `https://wa.me/${cleanPhone.startsWith('502') ? cleanPhone : '502' + cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}
