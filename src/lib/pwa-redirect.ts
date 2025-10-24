/**
 * PWA Redirect Service
 * Handles opening links in PWA context and fallback to web
 */

export interface PWARedirectOptions {
  customScheme?: string;
  fallbackUrl?: string;
  showInstructions?: boolean;
}

export class PWARedirectService {
  private customScheme: string;
  private fallbackUrl: string;
  private showInstructions: boolean;

  constructor(options: PWARedirectOptions = {}) {
    this.customScheme = options.customScheme || 'phoenixforce';
    this.fallbackUrl = options.fallbackUrl || (typeof window !== 'undefined' ? window.location.href : '');
    this.showInstructions = options.showInstructions ?? true;
  }

  /**
   * Check if user is currently in PWA context
   */
  isInPWA(): boolean {
    if (typeof window === 'undefined') return false;
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInApp = (window.navigator as any).standalone === true;
    return isStandalone || isInApp;
  }

  /**
   * Check if PWA is installed on the device
   */
  isPWAInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('pwa-installed') === 'true';
  }

  /**
   * Check if PWA can be installed
   */
  isPWAInstallable(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Convert web URL to custom scheme URL
   */
  convertToCustomScheme(url: string): string {
    return url.replace(/^https?:\/\//, `${this.customScheme}://`);
  }

  /**
   * Try to open URL in PWA context
   */
  async openInPWA(url?: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const targetUrl = url || window.location.href;
    
    try {
      // Check if we're on desktop (where custom schemes don't work)
      const isDesktop = !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isDesktop) {
        // On desktop, just show install prompt or instructions
        if (this.isPWAInstallable() && !this.isPWAInstalled()) {
          this.showInstallPrompt();
          return true;
        } else {
          // Show desktop-specific instructions
          alert('To get the best experience on desktop:\n\n1. Install Phoenix Force Cricket as a PWA\n2. Look for the install icon in your browser address bar\n3. Or use Chrome menu → "Install Phoenix Force Cricket"');
          return true;
        }
      }
      
      // Mobile: If PWA is installed, try to redirect
      if (this.isPWAInstalled()) {
        if (isIOS) {
          // iOS: Use universal link approach
          // Try to open with custom scheme first
          const customUrl = this.convertToCustomScheme(targetUrl);
          window.location.href = customUrl;
          
          // Fallback: If custom scheme doesn't work, show instructions
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              // Still on the page, custom scheme didn't work
              alert('To open in the Phoenix Force app:\n\n1. Long press this link\n2. Select "Open in Phoenix Force Cricket"\n\nOr open the app directly from your home screen.');
            }
          }, 1500);
          
          return true;
        } else if (isAndroid) {
          // Android: Use intent URL
          const intentUrl = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.phoenixforce.cricket;end`;
          
          try {
            window.location.href = intentUrl;
            return true;
          } catch (e) {
            // Fallback to custom scheme
            const customUrl = this.convertToCustomScheme(targetUrl);
            window.location.href = customUrl;
            return true;
          }
        }
      }
      
      // If PWA can be installed, show install prompt
      if (this.isPWAInstallable() && !this.isPWAInstalled()) {
        this.showInstallPrompt();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to open in PWA:', error);
      return false;
    }
  }

  /**
   * Show PWA installation prompt
   */
  private showInstallPrompt(): void {
    if (typeof window === 'undefined') return;
    
    // Dispatch custom event to trigger PWA install prompt
    const event = new CustomEvent('pwa-install-requested', {
      detail: { source: 'pwa-redirect-service' }
    });
    window.dispatchEvent(event);
  }

  /**
   * Show instructions for opening in PWA
   */
  displayInstructions(): void {
    if (!this.showInstructions) return;
    
    const instructions = this.getInstructions();
    alert(instructions);
  }

  /**
   * Get platform-specific instructions
   */
  private getInstructions(): string {
    if (typeof window === 'undefined') return 'Please install Phoenix Force Cricket app for the best experience!';
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      return `To open in Phoenix Force Cricket app:\n\n1. Open Safari\n2. Navigate to this page\n3. Tap the Share button\n4. Tap "Add to Home Screen"\n5. Open the app from your home screen`;
    } else if (isAndroid) {
      return `To open in Phoenix Force Cricket app:\n\n1. Look for the install icon (⊕) in your browser address bar\n2. Or tap the Chrome menu (⋮) → "Install Phoenix Force Cricket"\n3. Open the app from your home screen`;
    } else {
      return `To get the best experience:\n\n1. Install Phoenix Force Cricket as a PWA\n2. Open the app from your home screen\n3. Navigate to this page within the app`;
    }
  }

  /**
   * Handle PWA installation success
   */
  onPWAInstalled(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('pwa-installed', 'true');
    
    // Show success message
    if (this.showInstructions) {
      alert('Phoenix Force Cricket app installed successfully! You can now open it from your home screen.');
    }
  }

  /**
   * Get the best URL for sharing
   */
  getShareableUrl(): string {
    if (typeof window === 'undefined') return '';
    
    // Always return web URL for sharing
    // PWA detection will handle the "Open in App" prompt
    return window.location.href;
  }

  /**
   * Check if we should show "Open in App" prompt
   */
  shouldShowOpenInAppPrompt(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Don't show if already in PWA
    if (this.isInPWA()) return false;
    
    // Don't show on desktop (where custom schemes don't work)
    const isDesktop = !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isDesktop) return false;
    
    // Don't show if user dismissed in this session
    if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') return false;
    
    // Show if PWA is installed or can be installed (mobile only)
    return this.isPWAInstalled() || this.isPWAInstallable();
  }

  /**
   * Mark prompt as dismissed for this session
   */
  dismissPrompt(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  }
}

// Export singleton instance
export const pwaRedirect = new PWARedirectService({
  customScheme: 'phoenixforce',
  showInstructions: true
});
