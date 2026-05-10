/* ============================================================
   sw.js — Service Worker for PWA / offline support
   ============================================================ */

const CACHE_NAME = 'pc-savings-v1';

// Files to cache on install
const CACHE_FILES = [
  '/',
  '/index.html',
  '/public/css/base.css',
  '/public/css/components.css',
  '/public/css/layout.css',
  '/public/css/animations.css',
  '/src/utils/db.js',
  '/src/utils/helpers.js',
  '/src/utils/constants.js',
  '/src/components/toast.js',
  '/src/components/charts.js',
  '/src/components/modals.js',
  '/src/components/dashboard.js',
  '/src/components/addEntry.js',
  '/src/components/history.js',
  '/src/components/goals.js',
  '/src/components/importData.js',
  '/src/components/exportData.js',
  '/src/components/analytics.js',
  '/src/app.js',
  '/manifest.json',
];

// Install — cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// Activate — clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Let CDN requests go through the network first (charts, fonts, icons)
  const url = new URL(event.request.url);
  const isExternal = url.origin !== self.location.origin;

  if (isExternal) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Local files: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache valid responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
