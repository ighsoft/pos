// IGH-SOFT | PAR POS — Service Worker
// يُحدَّث هذا الرقم عند كل إصدار جديد لمسح الكاش القديم
const CACHE_NAME = 'par-pos-v4';

const ASSETS = [
  '/pos/',
  '/pos/index.html',
  '/pos/manifest.json',
  '/pos/icon-192.png',
  '/pos/icon-512.png'
];

// التثبيت — حفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// التفعيل — حذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// الطلبات — الشبكة أولاً، الكاش احتياطياً
self.addEventListener('fetch', (event) => {
  // Firebase و CDN — لا نتدخل فيها
  if (
    event.request.url.includes('firebase') ||
    event.request.url.includes('googleapis') ||
    event.request.url.includes('gstatic') ||
    event.request.url.includes('firebaseio')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // حفظ نسخة في الكاش عند كل طلب ناجح
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // بدون إنترنت — أرجع من الكاش
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/pos/index.html');
        });
      })
  );
});
