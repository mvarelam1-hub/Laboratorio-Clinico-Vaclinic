// Firebase Messaging Service Worker for VACLINIC Laboratorio Clínico
// Handles background push notifications when patient's browser or tab is in background

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAc5dD3A0OX2VQEZr400KX6P4-0NFgwmCg",
  authDomain: "helical-theater-420813.firebaseapp.com",
  projectId: "helical-theater-420813",
  storageBucket: "helical-theater-420813.firebasestorage.app",
  messagingSenderId: "50198317305",
  appId: "1:50198317305:web:8ac0af83964024e2e73a28"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);
  
  const notificationTitle = payload.notification?.title || '📄 ¡Tus Resultados de Laboratorio Están Listos!';
  const notificationOptions = {
    body: payload.notification?.body || 'Tus análisis clínicos de VACLINIC ya fueron validados y están disponibles.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: 'open_results', title: '🔍 Ver Resultados' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
