'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;

      // Add event listeners to handle any of the generated workbox events
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });

      wb.addEventListener('installed', (event) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);
      });

      wb.addEventListener('waiting', (event) => {
        console.log(`Event ${event.type} is triggered.`);
        console.log(event);

        // Show update available notification
        if (confirm('A new version is available! Click OK to update.')) {
          wb.messageSkipWaiting();
        }
      });

      wb.register();
    }
  }, []);
}

export default useServiceWorker;
