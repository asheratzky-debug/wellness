// Wellness Service Worker

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.clients.claim().then(() =>
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) =>
        Promise.all(clients.map((client) => client.navigate(client.url)))
      )
    )
  );
});

// ─── Network-first for HTML (forces fresh app on every open) ─────────────────

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).catch(() => caches.match(e.request))
    );
  }
});

// ─── Push notifications (weekly goals summary) ────────────────────────────────

self.addEventListener('push', (e) => {
  let data = { title: '🎯 סיכום מטרות שבועיות', body: 'לחץ לראות מצב המטרות שלך', url: '/' };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'weekly-goals',
      renotify: true,
      data: { url: data.url },
      dir: 'rtl',
      lang: 'he',
    })
  );
});

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ─── Sleep reminder (scheduled locally) ──────────────────────────────────────

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
    scheduleDailyReminder(hour, minute);
  }, delay);
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_SLEEP_REMINDER') {
    const hour = Number.isInteger(event.data.hour) && event.data.hour >= 0 && event.data.hour <= 23
      ? event.data.hour : 9;
    const minute = Number.isInteger(event.data.minute) && event.data.minute >= 0 && event.data.minute <= 59
      ? event.data.minute : 0;
    scheduleDailyReminder(hour, minute);
  }
});
