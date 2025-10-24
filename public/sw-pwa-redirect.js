/**
 * PWA Redirect Service Worker Enhancement
 * Handles PWA context detection and redirect logic
 */

// Listen for PWA installation
self.addEventListener('install', (event) => {
  console.log('PWA installed');
  // Mark PWA as installed in localStorage (will be available after page load)
  event.waitUntil(
    caches.open('pwa-installation').then(cache => {
      return cache.put('installed', new Response('true'));
    })
  );
});

// Listen for fetch events to handle PWA context
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle PWA redirect requests
  if (url.pathname.includes('/pwa-redirect')) {
    event.respondWith(handlePWARedirect(event.request));
    return;
  }
  
  // Handle custom scheme requests
  if (url.protocol === 'phoenixforce:') {
    event.respondWith(handleCustomScheme(event.request));
    return;
  }
});

// Handle PWA redirect requests
async function handlePWARedirect(request) {
  try {
    // Check if we're in PWA context
    const isPWA = self.registration.scope && 
                  (self.registration.scope.includes('localhost') || 
                   self.registration.scope.includes('phoenixforce'));
    
    if (isPWA) {
      // We're in PWA context, redirect to the actual page
      const targetUrl = new URL(request.url).searchParams.get('url') || '/';
      return Response.redirect(targetUrl, 302);
    } else {
      // We're in browser context, show PWA prompt
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Open in Phoenix Force Cricket App</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #19171b;
              color: white;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              border-radius: 16px;
            }
            h1 { font-size: 24px; margin-bottom: 16px; }
            p { color: #ccc; margin-bottom: 24px; }
            .btn {
              background: #4f46e5;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin: 8px;
            }
            .btn:hover { background: #4338ca; }
            .btn-secondary {
              background: transparent;
              border: 1px solid #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="/icons/icon-192x192.png" alt="Phoenix Force Cricket" class="logo">
            <h1>Open in Phoenix Force Cricket App</h1>
            <p>Get the best experience with our dedicated app for tournaments and auctions.</p>
            <button class="btn" onclick="openInPWA()">Open in App</button>
            <button class="btn btn-secondary" onclick="continueInBrowser()">Continue in Browser</button>
          </div>
          <script>
            function openInPWA() {
              // Try to open in PWA
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  // Check if PWA is installed
                  if (registration.scope) {
                    window.location.href = window.location.href.replace('/pwa-redirect', '');
                  } else {
                    // Show install prompt
                    if ('beforeinstallprompt' in window) {
                      window.beforeinstallprompt.prompt();
                    } else {
                      alert('Please install Phoenix Force Cricket app for the best experience!');
                    }
                  }
                });
              }
            }
            
            function continueInBrowser() {
              window.location.href = window.location.href.replace('/pwa-redirect', '');
            }
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  } catch (error) {
    console.error('PWA redirect error:', error);
    return new Response('Error handling PWA redirect', { status: 500 });
  }
}

// Handle custom scheme requests
async function handleCustomScheme(request) {
  // Convert custom scheme to web URL
  const webUrl = request.url.replace('phoenixforce://', 'https://');
  
  try {
    // Try to fetch the web version
    const response = await fetch(webUrl);
    return response;
  } catch (error) {
    // Fallback to redirect
    return Response.redirect(webUrl, 302);
  }
}

// Listen for PWA install events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PWA_INSTALLED') {
    // Mark PWA as installed
    event.waitUntil(
      caches.open('pwa-installation').then(cache => {
        return cache.put('installed', new Response('true'));
      })
    );
  }
});
