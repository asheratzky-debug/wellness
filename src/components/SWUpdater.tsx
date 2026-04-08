'use client';

import { useEffect } from 'react';

export default function SWUpdater() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // When a new SW takes over → reload to get fresh assets
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Register SW and trigger update check immediately
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.update(); // force check for new version on every page load
    });
  }, []);

  return null;
}
