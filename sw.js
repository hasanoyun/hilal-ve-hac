// Hilal ve Haç — çevrimdışı önbellek. İlk açılışta yüklenen her dosya saklanır; sonraki açılışlar
// önbellekten anında gelir, arka planda yenisi indirilir (bir sonraki açılışta güncel sürüm).
// Yeni sürüm yayınlarken VERSION'ı artır: eski önbellek silinir.
const VERSION = 'hh-v1';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/main.js', 'manifest.webmanifest', 'assets/manifest.json', 'assets/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ok = url.origin === location.origin || /cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!ok) return;
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: url.origin === location.origin });
    const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
