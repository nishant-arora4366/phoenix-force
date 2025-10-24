'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if app is already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);
    
    if (isStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Show instruction prompt for both iOS and Android after a delay
    const timer = setTimeout(() => {
      setShowInstallPrompt(true);
    }, 3000); // Show after 3 seconds
    
    return () => clearTimeout(timer);

    // Listen for the beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, we can't programmatically install, so we show instructions
      return;
    }
    
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  const handleManualInstall = () => {
    // Show instruction prompt for both iOS and Android
    setShowInstallPrompt(true);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Show manual install button if no instruction prompt is available
  if (showManualInstall && !showInstallPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleManualInstall}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Install App</span>
        </button>
      </div>
    );
  }

  // Don't show if no instruction prompt available
  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      {/* Backdrop overlay for better visibility */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg"></div>
      
      {/* Main dialog with reduced transparency */}
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
            {isIOS ? (
              <>
                <h3 className="text-sm font-semibold text-white">
                  Install Phoenix Force Cricket
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  To install this app on your iPhone:
                </p>
                <div className="text-xs text-gray-400 mt-2 space-y-1">
                  <div>1. Tap the Share button (square with arrow up)</div>
                  <div>2. Scroll down and tap "Add to Home Screen"</div>
                  <div>3. Tap "Add" to install</div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleDismiss}
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors shadow-lg"
                  >
                    Got it
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-md transition-colors hover:bg-gray-700/50"
                  >
                    Not now
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-white">
                  Install Phoenix Force Cricket
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  To install this app on your Android device:
                </p>
                <div className="text-xs text-gray-400 mt-2 space-y-1">
                  <div>1. Look for the install icon <span className="text-white">⊕</span> in your browser address bar</div>
                  <div>2. Or tap the Chrome menu (⋮) → "Install Phoenix Force Cricket"</div>
                  <div>3. Or go to Chrome menu → "Add to Home Screen"</div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleDismiss}
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors shadow-lg"
                  >
                    Got it
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-md transition-colors hover:bg-gray-700/50"
                  >
                    Not now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
