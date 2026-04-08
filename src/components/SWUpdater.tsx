'use client';

import { useEffect } from 'react';

const APP_VERSION = 2;
const VERSION_KEY = 'appVersion';

export default function SWUpdater() {
  useEffect(() => {
    // Version check — fetches from network, bypasses iOS PWA cache
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ v }: { v: number }) => {
        const stored = Number(localStorage.getItem(VERSION_KEY) ?? 0);
        if (v > stored) {
          localStorage.setItem(VERSION_KEY, String(v));
          window.location.reload();
        }
      })
      .catch(() => {});

    if (!('serviceWorker' in navigator)) return;

    // When a new SW takes over → reload to get fresh assets
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.update();
    });
  }, []);

  return null;
}

export { APP_VERSION };
