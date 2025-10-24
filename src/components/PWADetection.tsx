'use client';

import { useState, useEffect } from 'react';
import { pwaRedirect } from '@/src/lib/pwa-redirect';

interface PWADetectionProps {
  onOpenInApp?: () => void;
}

export default function PWADetection({ onOpenInApp }: PWADetectionProps) {
  const [isPWA, setIsPWA] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in PWA mode
    const checkPWAMode = () => {
      const isPWAContext = pwaRedirect.isInPWA();
      setIsPWA(isPWAContext);
      
      // Check if PWA is installed
      const isPWAInstalled = pwaRedirect.isPWAInstalled();
      setIsInstalled(isPWAInstalled);
      
      // Show prompt if in browser and PWA is available
      if (pwaRedirect.shouldShowOpenInAppPrompt()) {
        setShowPrompt(true);
      }
    };

    checkPWAMode();

    // Listen for PWA installation
    window.addEventListener('appinstalled', () => {
      pwaRedirect.onPWAInstalled();
      setIsInstalled(true);
      setShowPrompt(false);
    });

    // Listen for PWA install requests
    const handlePWAInstallRequest = () => {
      setShowPrompt(true);
    };

    window.addEventListener('pwa-install-requested', handlePWAInstallRequest);

    return () => {
      window.removeEventListener('pwa-install-requested', handlePWAInstallRequest);
    };
  }, []);

  const handleOpenInApp = async () => {
    if (onOpenInApp) {
      onOpenInApp();
    }
    
    // Use PWA redirect service
    const success = await pwaRedirect.openInPWA();
    
    if (!success) {
      // Show instructions if PWA redirect failed
      pwaRedirect.displayInstructions();
    }
    
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    pwaRedirect.dismissPrompt();
  };

  // Don't show if already in PWA or user dismissed
  if (isPWA || !showPrompt || (typeof window !== 'undefined' && sessionStorage.getItem('pwa-prompt-dismissed') === 'true')) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg"></div>
      
      {/* Main dialog */}
      <div className="relative bg-[#1a1619] border border-[#3a3539] rounded-lg p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <img 
              src="/icons/icon-72x72.png" 
              alt="Phoenix Force Cricket" 
              className="w-12 h-12 rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">
              Open in Phoenix Force App
            </h3>
            <p className="text-xs text-gray-300 mt-1">
              Get the best experience with our dedicated app for tournaments and auctions.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleOpenInApp}
                className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors shadow-lg"
              >
                Open in App
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-md transition-colors hover:bg-gray-700/50"
              >
                Continue in Browser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
