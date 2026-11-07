// Haroon Zarai Markaz PWA Service Worker (v1.1.0)
const CACHE_NAME = 'hzm-pwa-v1.1.0';

// Core static assets to pre-cache for instant loading & basic offline capability
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/admin',
  '/admin.html',
  '/khata',
  '/adviyaat',
  '/mandi',
  '/css/styles.css',
  '/js/app.js',
  '/js/admin.js',
  '/js/i18n.js',
  '/js/pwa.js',
  '/manifest.json',
  '/manifest-admin.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Helper: Check if request is an API, Supabase, or Auth endpoint that MUST NOT be cached
function shouldBypassCache(url) {
  const parsed = new URL(url);
  const pathname = parsed.pathname;
  const hostname = parsed.hostname;

  // 1. Supabase REST & Auth endpoints
  if (pathname.includes('/rest/v1/') || pathname.includes('/auth/v1/')) {
    return true;
  }
  if (hostname.includes('supabase.co') || hostname.includes('supabase.com')) {
    return true;
  }

  // 2. Application Backend API endpoints (Live Khata, DB transactions, login, etc.)
  if (pathname.startsWith('/api/')) {
    return true;
  }

  return false;
}

// 1. INSTALL EVENT
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🌾 [Service Worker] Pre-caching core assets for offline support');
      // Use individual promises so one missing CDN or file doesn't block worker installation
      return Promise.allSettled(
        CORE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[Service Worker] Failed to cache: ${asset}`, err);
          })
        )
      );
    })
  );
});

// 2. ACTIVATE EVENT (Cleanup old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`🧹 [Service Worker] Deleting obsolete cache: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Only handle GET requests with HTTP/HTTPS protocols
  if (req.method !== 'GET' || !url.startsWith('http')) {
    return;
  }

  // CRITICAL: Always bypass cache for Supabase, Auth, and backend API requests
  if (shouldBypassCache(url)) {
    // Pure network-only request to guarantee live fresh data
    event.respondWith(
      fetch(req).catch((err) => {
        console.warn(`[Service Worker] Network error on API/Auth request: ${url}`, err);
        return new Response(
          JSON.stringify({ error: 'Network unavailable. Please check your internet connection.' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          }
        );
      })
    );
    return;
  }

  // Uploaded receipt images (/uploads/...) - Cache First with Network Fallback
  if (new URL(url).pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(req);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch (e) {
          return new Response('Receipt image unavailable offline', { status: 404, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // Navigation requests (HTML pages) - Network First with Cache Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cachedResponse = await caches.match(req);
          if (cachedResponse) return cachedResponse;

          // Fallback to cached home page
          const fallbackHome = await caches.match('/');
          if (fallbackHome) return fallbackHome;

          return new Response(
            `<!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>انٹرنیٹ موجود نہیں - ہارون زرعی مرکز</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #064e3b; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; color: #facc15; }
                p { font-size: 15px; color: #d1fae5; max-width: 400px; line-height: 1.6; }
                button { background: #facc15; color: #022c22; border: none; padding: 12px 24px; font-size: 16px; font-weight: bold; border-radius: 12px; margin-top: 20px; cursor: pointer; }
              </style>
            </head>
            <body>
              <h1>🌾 ہارون زرعی مرکز</h1>
              <p>اس وقت آپ کا انٹرنیٹ کنکشن منقطع ہے۔ براؤزنگ بحال کرنے کے لیے براہ کرم اپنا انٹرنیٹ چیک کریں۔</p>
              <button onclick="window.location.reload()">دوبارہ کوشش کریں (Retry)</button>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        })
    );
    return;
  }

  // All other static assets (CSS, JS, Fonts, Images) - Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fetch fails, it is silent since cachedResponse or offline handles it
        });

      return cachedResponse || fetchPromise;
    })
  );
});
