'use client';

import { useState, useEffect } from 'react';
import { pwaRedirect } from '@/src/lib/pwa-redirect';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type NotificationType = 'install' | 'open-in-app' | 'open-instructions' | null;

export default function PWANotification() {
  const [notificationType, setNotificationType] = useState<NotificationType>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(userAgent);
    const android = /Android/.test(userAgent);
    const desktop = !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    setIsIOS(iOS);
    setIsAndroid(android);
    setIsDesktop(desktop);
    
    // Check if running in PWA mode
    const isPWAMode = pwaRedirect.isInPWA();
    setIsPWA(isPWAMode);
    
    // If in PWA mode, mark as opened in standalone and don't show notifications
    if (isPWAMode) {
      localStorage.setItem('pwa-opened-standalone', 'true');
      return;
    }
    
    // Check if user dismissed notification in this session
    if (sessionStorage.getItem('pwa-notification-dismissed') === 'true') {
      return;
    }
    
    // Priority 1: If PWA is installed, show "Open in App" prompt (mobile only)
    if (!desktop && pwaRedirect.isPWAInstalled()) {
      const timer = setTimeout(() => {
        setNotificationType('open-in-app');
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    // Priority 2: Show install prompt after delay
    const timer = setTimeout(() => {
      setNotificationType('install');
    }, 3000);
    
    // Listen for beforeinstallprompt (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    // Listen for app installed
    const handleAppInstalled = () => {
      pwaRedirect.onPWAInstalled();
      setNotificationType(null);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleOpenInApp = async () => {
    if (isIOS) {
      // iOS: Show instructions in the card
      setNotificationType('open-instructions');
    } else {
      // Android: Try to redirect
      const success = await pwaRedirect.openInPWA();
      
      if (!success) {
        // If redirect failed, show install instructions instead
        setNotificationType('install');
      } else {
        handleDismiss();
      }
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install, instructions are already shown
      return;
    }
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setNotificationType(null);
    sessionStorage.setItem('pwa-notification-dismissed', 'true');
    pwaRedirect.dismissPrompt();
  };
  
  const handleGotIt = () => {
    // Mark as "will install" so next time we show "Open in App"
    if (isIOS) {
      localStorage.setItem('pwa-opened-standalone', 'true');
    }
    handleDismiss();
  };

  // Don't show if no notification type or already in PWA
  if (!notificationType || isPWA) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:max-w-sm animate-slide-down">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md rounded-xl"></div>
      
      {/* Main notification card */}
      <div className="relative bg-gradient-to-br from-[#1a1619]/95 to-[#0f0d0f]/95 border border-[#CEA17A]/40 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <img 
              src="/icons/icon-72x72.png" 
              alt="Phoenix Force Cricket" 
              className="w-12 h-12 rounded-xl shadow-lg"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {notificationType === 'open-in-app' ? (
              <>
                <h3 className="text-sm font-bold text-[#CEA17A]">
                  Open in Phoenix Force App
                </h3>
                <p className="text-xs text-[#DBD0C0] mt-1.5 leading-relaxed">
                  Get the best experience with faster loading and offline access.
                </p>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleOpenInApp}
                    className="bg-[#CEA17A] hover:bg-[#CEA17A]/90 text-[#19171b] text-xs px-4 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Open in App
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-[#DBD0C0] hover:text-white text-xs px-3 py-2 rounded-lg transition-colors hover:bg-[#CEA17A]/20 border border-[#CEA17A]/30"
                  >
                    Continue in Browser
                  </button>
                </div>
              </>
            ) : notificationType === 'open-instructions' ? (
              <>
                <h3 className="text-sm font-bold text-[#CEA17A]">
                  How to Open in App
                </h3>
                <p className="text-xs text-[#DBD0C0] mt-1.5 leading-relaxed">
                  Follow these steps to open in the Phoenix Force app:
                </p>
                <div className="text-xs text-[#DBD0C0] mt-2 space-y-1.5 bg-[#0f0d0f]/80 rounded-lg p-2.5 border border-[#CEA17A]/20">
                  <div className="flex items-start space-x-2">
                    <span className="text-[#CEA17A] font-bold">1.</span>
                    <span>Tap the <strong>Share button (⎋)</strong> at the bottom of Safari</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-[#CEA17A] font-bold">2.</span>
                    <span>Scroll down and tap <strong>"Phoenix Force Cricket"</strong></span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-[#CEA17A] font-bold">OR</span>
                    <span>Simply open the <strong>Phoenix Force app</strong> from your home screen!</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleDismiss}
                    className="bg-[#CEA17A] hover:bg-[#CEA17A]/90 text-[#19171b] text-xs px-4 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Got it
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-[#DBD0C0] hover:text-white text-xs px-3 py-2 rounded-lg transition-colors hover:bg-[#CEA17A]/20 border border-[#CEA17A]/30"
                  >
                    Continue in Browser
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-[#CEA17A]">
                  Install Phoenix Force Cricket
                </h3>
                {isIOS ? (
                  <>
                    <p className="text-xs text-[#DBD0C0] mt-1.5 leading-relaxed">
                      Install for quick access and offline features:
                    </p>
                    <div className="text-xs text-[#DBD0C0] mt-2 space-y-1.5 bg-[#0f0d0f]/80 rounded-lg p-2.5 border border-[#CEA17A]/20">
                      <div className="flex items-start space-x-2">
                        <span className="text-[#CEA17A] font-bold">1.</span>
                        <span>Tap the <strong>Share</strong> button <span className="inline-block">⎋</span></span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-[#CEA17A] font-bold">2.</span>
                        <span>Scroll and tap <strong>"Add to Home Screen"</strong></span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-[#CEA17A] font-bold">3.</span>
                        <span>Tap <strong>"Add"</strong> to install</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-[#DBD0C0] mt-1.5 leading-relaxed">
                      Install for quick access and offline features:
                    </p>
                    <div className="text-xs text-[#DBD0C0] mt-2 space-y-1.5 bg-[#0f0d0f]/80 rounded-lg p-2.5 border border-[#CEA17A]/20">
                      {deferredPrompt ? (
                        <div className="text-center py-1">
                          <span className="text-[#CEA17A]">Click "Install" below to add to your home screen</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start space-x-2">
                            <span className="text-[#CEA17A] font-bold">•</span>
                            <span>Tap <strong>Menu (⋮)</strong> → <strong>"Add to Home Screen"</strong></span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-[#CEA17A] font-bold">•</span>
                            <span>Or look for <strong>install icon</strong> in address bar</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
                <div className="flex space-x-2 mt-3">
                  {deferredPrompt && !isIOS && (
                    <button
                      onClick={handleInstall}
                      className="bg-[#CEA17A] hover:bg-[#CEA17A]/90 text-[#19171b] text-xs px-4 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Install
                    </button>
                  )}
                  <button
                    onClick={isIOS ? handleGotIt : handleDismiss}
                    className={`text-xs px-3 py-2 rounded-lg transition-all ${
                      deferredPrompt && !isIOS
                        ? 'text-[#DBD0C0] hover:text-white hover:bg-[#CEA17A]/20 border border-[#CEA17A]/30'
                        : 'bg-[#CEA17A] hover:bg-[#CEA17A]/90 text-[#19171b] font-semibold shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {deferredPrompt && !isIOS ? 'Not now' : 'Got it'}
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
