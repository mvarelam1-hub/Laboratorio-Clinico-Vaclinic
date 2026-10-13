// Service worker mínimo de VACLINIC: permite instalar la app en el celular o en la PC.
// No guarda datos en caché a propósito: la información clínica siempre se pide al servidor.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
