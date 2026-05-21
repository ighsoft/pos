// PAR POS - Service Worker v1.0
const CACHE_NAME = 'par-pos-v1';
const FILES_TO_CACHE = [
    'PAR_POS_V2.html',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// تثبيت الكاش
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.add('PAR_POS_V2.html');
        })
    );
    self.skipWaiting();
});

// تفعيل وحذف الكاش القديم
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// الاستجابة للطلبات
self.addEventListener('fetch', event => {
    // Firebase وطلبات الشبكة الخارجية — لا نخزنها
    if (event.request.url.includes('firebase') ||
        event.request.url.includes('googleapis') ||
        event.request.url.includes('gstatic')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // خزّن الملف الرئيسي فقط
                if (event.request.url.includes('PAR_POS_V2.html')) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // بدون إنترنت — أرجع النسخة المخزنة
                return caches.match('PAR_POS_V2.html');
            });
        })
    );
});
