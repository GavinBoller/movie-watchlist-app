"use strict";
// Movie Watchlist App - Service Worker (TypeScript)
// Provides offline support and performance optimization
/// <reference lib="webworker" />
// ServiceWorker global scope
const sw = self;
// Cache configuration
const CACHE_VERSION = 'v1';
const CACHE_NAME = `movie-watchlist-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `movie-watchlist-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `movie-watchlist-api-${CACHE_VERSION}`;
// Cache TTL in milliseconds
const STATIC_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/search',
    '/watchlist',
    '/settings',
    '/manifest.json',
    '/app-icon.svg',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/apple-touch-icon.png',
    '/offline.html'
];
// API endpoints to cache (with shorter TTL)
const API_ROUTES = [
    '/api/genres',
    '/api/platforms',
    '/api/tmdb-countries'
];
// File extensions to cache with cache-first strategy
const CACHEABLE_EXTENSIONS = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf'
];
// Install event - cache static assets
sw.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(Promise.all([
        // Cache static assets
        caches.open(STATIC_CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        }),
        // Cache API routes
        caches.open(API_CACHE_NAME).then((cache) => {
            console.log('Service Worker: Pre-caching API routes');
            // Pre-cache some API routes
            return Promise.allSettled(API_ROUTES.map((route) => fetch(route)
                .then((response) => response.ok ? cache.put(route, response) : null)
                .catch(() => null) // Ignore failures during pre-caching
            ));
        })
    ]).then(() => {
        console.log('Service Worker: Installation complete');
        // Force activation of new service worker
        return sw.skipWaiting();
    }));
});
// Activate event - clean up old caches
sw.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(Promise.all([
        // Clean up old caches
        caches.keys().then((cacheNames) => {
            return Promise.all(cacheNames.map((cacheName) => {
                if (cacheName.startsWith('movie-watchlist-') &&
                    !cacheName.includes(CACHE_VERSION)) {
                    console.log('Service Worker: Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                }
                return Promise.resolve();
            }));
        }),
        // Take control of all clients
        sw.clients.claim()
    ]).then(() => {
        console.log('Service Worker: Activation complete');
    }));
});
// Fetch event - implement caching strategies
sw.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    // Skip non-GET requests and chrome-extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    // Handle different types of requests
    if (url.pathname.startsWith('/api/auth/')) {
        // Skip authentication routes entirely - let them pass through normally
        return;
    }
    else if (url.pathname.startsWith('/api/')) {
        // API routes (excluding auth): Network first, fallback to cache
        event.respondWith(handleApiRequest(request));
    }
    else if (url.hostname === sw.location.hostname && isStaticAsset(url.pathname)) {
        // Local static assets: Cache first, fallback to network
        event.respondWith(handleStaticAsset(request));
    }
    else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        // Google Fonts: Cache first, fallback to network
        event.respondWith(handleStaticAsset(request));
    }
    else if (url.hostname === sw.location.hostname) {
        // Local HTML pages: Network first, fallback to cache, then offline page
        event.respondWith(handlePageRequest(request));
    }
    // Let external resources (like TMDB images) be handled normally by the browser
});
// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE_NAME);
    try {
        // Try network first
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Clone and cache the response
            const responseClone = networkResponse.clone();
            // Add timestamp for cache expiration
            const headers = {};
            responseClone.headers.forEach((value, key) => {
                headers[key] = value;
            });
            headers['sw-cached-at'] = Date.now().toString();
            const responseWithTimestamp = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers
            });
            cache.put(request, responseWithTimestamp);
            return networkResponse;
        }
        throw new Error(`Network response not ok: ${networkResponse.status}`);
    }
    catch (error) {
        console.log('Service Worker: Network failed, trying cache for:', request.url);
        // Try cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Check if cache is still valid
            const cachedAt = cachedResponse.headers.get('sw-cached-at');
            if (cachedAt && Date.now() - parseInt(cachedAt) < API_CACHE_TTL) {
                return cachedResponse;
            }
        }
        // Return error response
        return new Response(JSON.stringify({ error: 'Offline and no cached data available' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    try {
        // Fallback to network
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache the response
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }
    catch (error) {
        console.log('Service Worker: Failed to fetch static asset:', request.url);
        // Return a placeholder for missing images
        if (request.url.includes('.png') || request.url.includes('.jpg') || request.url.includes('.jpeg')) {
            return new Response('', { status: 404, statusText: 'Image Not Found' });
        }
        throw error;
    }
}
// Handle page requests with network-first strategy and offline fallback
async function handlePageRequest(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    try {
        // Try network first
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache successful page responses
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error(`Network response not ok: ${networkResponse.status}`);
    }
    catch (error) {
        console.log('Service Worker: Network failed, trying cache for:', request.url);
        // Try cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Fallback to offline page
        const offlineResponse = await cache.match('/offline.html');
        if (offlineResponse) {
            return offlineResponse;
        }
        // Last resort: return a simple offline message
        return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Offline</title></head>
        <body>
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </body>
      </html>
    `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}
// Check if a URL is a static asset
function isStaticAsset(pathname) {
    return CACHEABLE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}
// Handle background sync
sw.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    if (event.tag === 'background-sync-watchlist') {
        event.waitUntil(processOfflineQueue());
    }
});
// Process offline action queue
async function processOfflineQueue() {
    try {
        // This would typically read from IndexedDB
        // For now, we'll just log that sync is happening
        console.log('Service Worker: Processing offline queue...');
        // In a full implementation, this would:
        // 1. Read queued actions from IndexedDB
        // 2. Execute each action
        // 3. Remove successful actions from queue
        // 4. Update retry counts for failed actions
        // Send message to main thread that sync is complete
        const clients = await sw.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'BACKGROUND_SYNC_COMPLETE',
                payload: { processed: 0 }
            });
        });
    }
    catch (error) {
        console.error('Service Worker: Background sync failed:', error);
    }
}
// Handle messages from main thread
sw.addEventListener('message', (event) => {
    console.log('Service Worker: Message received:', event.data);
    const { type, payload } = event.data;
    switch (type) {
        case 'SKIP_WAITING':
            sw.skipWaiting();
            break;
        case 'QUEUE_ACTION':
            // Handle action queuing
            console.log('Service Worker: Action queued:', payload);
            break;
        case 'GET_CACHE_STATUS':
            // Return cache status
            getCacheStatus().then((status) => {
                var _a;
                (_a = event.ports[0]) === null || _a === void 0 ? void 0 : _a.postMessage(status);
            });
            break;
        default:
            console.log('Service Worker: Unknown message type:', type);
    }
});
// Get cache status information
async function getCacheStatus() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    // Note: Calculating exact cache size requires iterating through all entries
    // This is a simplified implementation
    return {
        cacheNames: cacheNames.filter(name => name.startsWith('movie-watchlist-')),
        totalSize,
        lastUpdated: Date.now()
    };
}
// Error handling
sw.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred:', event.error);
});
sw.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection:', event.reason);
});
console.log('Service Worker: Script loaded');
