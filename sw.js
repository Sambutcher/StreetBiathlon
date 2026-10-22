// Service worker : tout le jeu est mis en cache à l'installation pour jouer hors ligne.
// Changer VERSION à chaque mise en ligne, sinon les téléphones gardent l'ancienne version.
const VERSION = '2026-10-22.1';
const CACHE = `street-biathlon-${VERSION}`;

const FICHIERS = [
  './',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'vendor/tf.min.js',
  'js/main.js',
  'js/camera.js',
  'js/detector.js',
  'js/game.js',
  'js/geometry.js',
  'js/render.js',
  'js/tracker.js',
  'models/yolo11n/model.json',
  // FICHIERS_MODELE
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(
    caches.match(ev.request, { ignoreSearch: true }).then((r) => r || fetch(ev.request)),
  );
});
