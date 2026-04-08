export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

// ─── Sleep reminder ───────────────────────────────────────────────────────────

export async function enableSleepReminder(hour = 9, minute = 0): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return 'denied';

  const reg = await registerSW();
  if (!reg) return 'unsupported';

  const sw = reg.active ?? reg.installing ?? reg.waiting;
  if (sw) {
    sw.postMessage({ type: 'SCHEDULE_SLEEP_REMINDER', hour, minute });
  } else {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      navigator.serviceWorker.controller?.postMessage({ type: 'SCHEDULE_SLEEP_REMINDER', hour, minute });
    });
  }

  localStorage.setItem('sleepReminderEnabled', 'true');

  // Also register server-side push for when app is closed
  await _syncSleepHourToServer(hour);

  return 'granted';
}

async function _syncSleepHourToServer(hour: number | null): Promise<void> {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    const reg = await registerSW();
    if (!reg) return;
    const existing = await reg.pushManager.getSubscription();
    if (!existing) return; // not subscribed to push yet — nothing to sync
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing.toJSON(), sleepHour: hour }),
    });
  } catch {}
}

export function isSleepReminderEnabled(): boolean {
  return localStorage.getItem('sleepReminderEnabled') === 'true' &&
    Notification.permission === 'granted';
}

export function disableSleepReminder(): void {
  localStorage.removeItem('sleepReminderEnabled');
  _syncSleepHourToServer(null); // remove from server
}

// ─── Push subscription (weekly goals) ────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export async function subscribeToPushNotifications(): Promise<boolean> {
  try {
    if (!('Notification' in window) || !('PushManager' in window)) return false;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return false;

    const reg = await registerSW();
    if (!reg) return false;

    // Wait for SW to be active
    await new Promise<void>((resolve) => {
      if (reg.active) { resolve(); return; }
      const sw = reg.installing ?? reg.waiting;
      if (sw) {
        sw.addEventListener('statechange', function handler() {
          if (this.state === 'activated') { resolve(); sw.removeEventListener('statechange', handler); }
        });
      } else {
        resolve();
      }
    });

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!res.ok) return false;

    localStorage.setItem('pushSubscribed', 'true');
    return true;
  } catch (err) {
    console.error('[push] subscribe error', err);
    return false;
  }
}

export function isPushSubscribed(): boolean {
  return localStorage.getItem('pushSubscribed') === 'true' &&
    Notification.permission === 'granted';
}
