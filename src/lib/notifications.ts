export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

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
  return 'granted';
}

export function isSleepReminderEnabled(): boolean {
  return localStorage.getItem('sleepReminderEnabled') === 'true' &&
    Notification.permission === 'granted';
}

export function disableSleepReminder(): void {
  localStorage.removeItem('sleepReminderEnabled');
}
