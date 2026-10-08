import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';
import { getAuth, Auth } from 'firebase/auth';

// Firebase Client Configuration loaded from project environment
export const firebaseConfig = {
  apiKey: "AIzaSyAc5dD3A0OX2VQEZr400KX6P4-0NFgwmCg",
  authDomain: "helical-theater-420813.firebaseapp.com",
  projectId: "helical-theater-420813",
  storageBucket: "helical-theater-420813.firebasestorage.app",
  messagingSenderId: "50198317305",
  appId: "1:50198317305:web:8ac0af83964024e2e73a28"
};

let app: FirebaseApp | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
};

let authInstance: Auth | null = null;

/**
 * Firebase Authentication (Etapa 3) — reemplaza el PIN compartido hardcodeado
 * de StaffLoginView.tsx. Este es el ÚNICO lugar donde se inicializa `Auth`
 * en el cliente; el backend nunca confía en esto por sí solo, siempre
 * vuelve a verificar el ID token con el Admin SDK (ver server/auth-firebase.ts).
 */
export const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
};

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;
  if (messagingPromise) return messagingPromise;

  messagingPromise = (async () => {
    try {
      const supported = await isSupported();
      if (!supported) {
        console.info('[Firebase Messaging] Not supported in this browser environment or iframe context.');
        return null;
      }
      const currentApp = getFirebaseApp();
      return getMessaging(currentApp);
    } catch (err) {
      console.warn('[Firebase Messaging] Initialization warning:', err);
      return null;
    }
  })();

  return messagingPromise;
};
