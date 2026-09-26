/**
 * Service Worker — Dicoding Story
 *
 * Tanggung jawab:
 * 1. Precache application shell agar aplikasi tetap bisa dibuka saat offline
 *    (Kriteria 3 — PWA, Basic).
 * 2. Menangani event `push` dan menampilkan notifikasi dengan judul/isi/ikon
 *    dinamis berdasarkan data yang dikirim server (Kriteria 2 — Push
 *    Notification, Basic + Skilled).
 *
 * File ini SENGAJA ditulis sebagai skrip biasa (bukan modul ES) dan disalin
 * apa adanya ke root `dist/` lewat CopyWebpackPlugin, supaya bisa didaftarkan
 * dengan scope root ('/') tanpa perlu langkah build tambahan.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `dicoding-story-shell-${CACHE_VERSION}`;

// Aset inti application shell. Nama berkas JS mengikuti `output.filename`
// pada webpack.common.js (`[name].bundle.js`, tanpa hash).
const APP_SHELL = [
  './',
  './index.html',
  './app.bundle.js',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('dicoding-story-shell-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Strategi: cache-first untuk request same-origin (app shell + aset statis),
// dengan pengisian cache berjalan (runtime caching) untuk aset baru.
// Request lintas origin (Story API, tile peta) dibiarkan berjalan normal ke
// jaringan — cache dinamis untuk data API bukan bagian dari kriteria yang
// sedang ditarget, jadi sengaja tidak dipaksakan di sini.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  if (!isSameOrigin) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline dan tidak ada di cache — untuk navigasi halaman, jatuhkan
          // ke app shell (index.html) supaya SPA tetap terbuka.
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return undefined;
        });
    }),
  );
});

// ============================================================
// Push Notification — Kriteria 2
// ============================================================

self.addEventListener('push', (event) => {
  const fallback = {
    title: 'Dicoding Story',
    options: {
      body: 'Ada story baru dari komunitas Dicoding.',
    },
  };

  async function resolvePayload() {
    if (!event.data) return fallback;
    try {
      return event.data.json();
    } catch (error) {
      // Server dapat mengirim payload teks biasa di luar kondisi normal.
      return { title: fallback.title, options: { body: event.data.text() } };
    }
  }

  async function showStoryNotification() {
    const payload = await resolvePayload();
    const title = payload.title || fallback.title;
    const serverOptions = payload.options || {};

    await self.registration.showNotification(title, {
      body: serverOptions.body || fallback.options.body,
      icon: serverOptions.icon || './icons/icon-192.png',
      badge: './icons/icon-192.png',
      data: {
        url: serverOptions.url || './index.html#/',
      },
    });
  }

  event.waitUntil(showStoryNotification());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || './index.html#/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      const existingClient = clientsList.find((client) => 'focus' in client);
      if (existingClient) {
        existingClient.navigate(targetUrl);
        return existingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
