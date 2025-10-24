'use client';

import { useState, useEffect } from 'react';

export default function PWAStatus() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
    };

    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Initial checks
    checkStandalone();
    checkOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  if (!isStandalone) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="flex items-center space-x-2 bg-[#2a2529] border border-[#3a3539] rounded-lg px-3 py-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-300">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <span className="text-xs text-gray-500">•</span>
        <span className="text-xs text-gray-300">PWA</span>
      </div>
    </div>
  );
}
