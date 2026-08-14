// 🛠️ Robust Industrial Service Worker for Novarea Textiles
// Ensures background notification delivery even when the app is fully closed.

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
    console.log('[SW] Installed and SkipWaiting executed.');
});

self.addEventListener('activate', (event) => {
    // Ensure the service worker controls all clients immediately.
    event.waitUntil(clients.claim());
    console.log('[SW] Activated and ClientsClaimed.');
});

self.addEventListener('push', function(event) {
    console.log('[SW] Push Received.');
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/favicon.png',
            badge: '/favicon.png',
            vibrate: [200, 100, 200, 100, 400], // Industrial alert pattern
            tag: 'novarea-alert', // Groups identical alerts
            renotify: true, // Vibrates even if same tag exists
            requireInteraction: true, // Keeps notification visible until user clicks
            data: {
                url: data.url || '/dashboard'
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Novarea Alert', options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification Clicked.');
    event.notification.close();

    // Logic to open or focus the app window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
