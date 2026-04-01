// Wellness Service Worker - Sleep Reminder Notifications

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_SLEEP_REMINDER') {
    const hour = Number.isInteger(event.data.hour) && event.data.hour >= 0 && event.data.hour <= 23
      ? event.data.hour : 9;
    const minute = Number.isInteger(event.data.minute) && event.data.minute >= 0 && event.data.minute <= 59
      ? event.data.minute : 0;
    scheduleDailyReminder(hour, minute);
  }
});

let reminderTimeout = null;

function scheduleDailyReminder(hour, minute) {
  if (reminderTimeout) clearTimeout(reminderTimeout);

  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();

  reminderTimeout = setTimeout(() => {
    self.registration.showNotification('Wellness 😴', {
      body: 'כמה שעות ישנת הלילה? לחץ לתיעוד',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'sleep-reminder',
      renotify: true,
      data: { url: '/health' },
    });
    // Schedule again for tomorrow
    scheduleDailyReminder(hour, minute);
  }, delay);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/health');
    })
  );
});
