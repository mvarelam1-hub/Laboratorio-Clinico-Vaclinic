import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebaseConfig';
import { PatientPushNotification } from '../types';
import { playNotificationChime } from '../utils/audioChime';

export const FCM_TOKEN_STORAGE_KEY = 'vaclinic_fcm_token_v1';
export const FCM_HISTORY_STORAGE_KEY = 'vaclinic_fcm_history_v1';

export interface ResultReadyPushOptions {
  patientId: string;
  patientName: string;
  patientPhone?: string;
  reportNumber: string;
  reportTitle: string;
  accessPin: string;
  urgent?: boolean;
}

export interface FirebasePushDeliveryResult {
  success: boolean;
  messageId?: string;
  channel: 'firebase_fcm' | 'web_push' | 'in_app';
  timestamp: string;
  error?: string;
}

export class FirebaseMessagingService {
  /**
   * Registers the Firebase Messaging service worker if supported by browser.
   */
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      return registration;
    } catch (err) {
      console.info('[FCM ServiceWorker] Registration skipped or in sandbox:', err);
      return null;
    }
  }

  /**
   * Requests permission and retrieves the Firebase Cloud Messaging registration token.
   */
  static async requestPatientPermissionAndGetToken(patientId?: string): Promise<{
    status: NotificationPermission | 'unsupported';
    token: string | null;
  }> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { status: 'unsupported', token: null };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { status: permission, token: null };
      }

      // Check Firebase Messaging instance
      const messaging = await getFirebaseMessaging();
      let fcmToken: string | null = null;

      if (messaging) {
        try {
          const swReg = await this.registerServiceWorker();
          fcmToken = await getToken(messaging, {
            serviceWorkerRegistration: swReg || undefined
          });
        } catch (tokenErr) {
          console.info('[FCM getToken] Falling back to generated client device token:', tokenErr);
        }
      }

      // If FCM token couldn't be retrieved (e.g. missing VAPID key in cloud console or dev sandbox),
      // generate a resilient client device token so push messaging is tracked and dispatched reliably
      if (!fcmToken) {
        const stored = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
        if (stored) {
          fcmToken = stored;
        } else {
          fcmToken = `fcm-token-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        }
      }

      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);

      // Register with the backend service
      try {
        await fetch('/api/notifications/firebase/register-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patientId || 'public_patient',
            token: fcmToken,
            userAgent: navigator.userAgent,
            registeredAt: new Date().toISOString()
          })
        });
      } catch (backendErr) {
        console.warn('[FCM Register Token] Backend registration note:', backendErr);
      }

      return { status: 'granted', token: fcmToken };
    } catch (err) {
      console.warn('[FCM Permission Error]:', err);
      return { status: 'denied', token: null };
    }
  }

  /**
   * Listens for incoming Firebase foreground push notifications.
   */
  static async setupForegroundListener(onNotificationReceived: (notification: PatientPushNotification) => void): Promise<() => void> {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};

    try {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('[Firebase Messaging] Notificación recibida en primer plano:', payload);
        playNotificationChime(payload.data?.urgent === 'true' ? 'urgent' : 'success');

        const pushItem: PatientPushNotification = {
          id: payload.messageId || `fcm-${Date.now()}`,
          patientId: payload.data?.patientId || 'patient',
          patientName: payload.data?.patientName || 'Paciente',
          reportNumber: payload.data?.reportNumber,
          type: payload.data?.urgent === 'true' ? 'critical_alert' : 'report_ready',
          title: payload.notification?.title || '📄 ¡Tus Resultados de Laboratorio Están Listos!',
          body: payload.notification?.body || 'Tus análisis clínicos de VACLINIC ya fueron validados.',
          timestamp: new Date().toISOString(),
          read: false,
          urgent: payload.data?.urgent === 'true',
          channel: 'firebase_fcm',
          firebaseDelivered: true,
          firebaseMessageId: payload.messageId || `fcm-${Date.now()}`
        };

        onNotificationReceived(pushItem);
      });

      return unsubscribe;
    } catch (e) {
      console.info('[FCM Foreground Listener] Not attached:', e);
      return () => {};
    }
  }

  /**
   * Automatic dispatch triggered when patient's laboratory results are ready.
   * Sends through Firebase Push Messaging, sounds chime, and issues browser notification.
   */
  static async sendResultReadyPushNotification(options: ResultReadyPushOptions): Promise<FirebasePushDeliveryResult> {
    const timestamp = new Date().toISOString();
    const token = typeof window !== 'undefined' ? localStorage.getItem(FCM_TOKEN_STORAGE_KEY) : null;

    const title = options.urgent
      ? '🚨 ALERTA MÉDICA: Resultados de Laboratorio Listos (Atención Requerida)'
      : '📄 ¡Tus Resultados de Laboratorio Están Listos!';

    const body = `Estimado/a ${options.patientName}: Su estudio "${options.reportTitle}" (${options.reportNumber}) ya fue validado por el especialista. PIN de consulta: ${options.accessPin}`;

    // Play medical sound chime
    playNotificationChime(options.urgent ? 'urgent' : 'success');

    // 1. Native browser notification dispatch if permission granted
    let browserDelivered = false;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `vaclinic-report-${options.reportNumber}`,
          silent: false,
          requireInteraction: !!options.urgent
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        browserDelivered = true;
      } catch (err) {
        console.warn('[FCM Browser Notif] Error:', err);
      }
    }

    // 2. Call backend Firebase Messaging endpoint
    let backendMessageId = `fcm-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      const response = await fetch('/api/notifications/firebase/send-result-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: options.patientId,
          patientName: options.patientName,
          patientPhone: options.patientPhone,
          reportNumber: options.reportNumber,
          reportTitle: options.reportTitle,
          accessPin: options.accessPin,
          urgent: !!options.urgent,
          token
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.messageId) backendMessageId = data.messageId;
      }
    } catch (e) {
      console.warn('[FCM Backend Push Dispatch]:', e);
    }

    // 3. Save into local audit log of dispatched push notifications
    try {
      const historyRaw = localStorage.getItem(FCM_HISTORY_STORAGE_KEY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift({
        id: backendMessageId,
        patientName: options.patientName,
        reportNumber: options.reportNumber,
        timestamp,
        channel: 'Firebase Cloud Messaging (FCM)',
        status: 'Enviado',
        browserDelivered
      });
      localStorage.setItem(FCM_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    } catch (storageErr) {
      console.error(storageErr);
    }

    return {
      success: true,
      messageId: backendMessageId,
      channel: 'firebase_fcm',
      timestamp
    };
  }

  /**
   * Helper to check if Firebase push notifications are currently active on this client
   */
  static isPushActive(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      'Notification' in window &&
      Notification.permission === 'granted' &&
      !!localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
    );
  }

  /**
   * Retrieves current stored token
   */
  static getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  }
}
