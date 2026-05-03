const CACHE_NAME = 'momshopstop-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://i.postimg.cc/qqXX4XHs/291701777-433557862112157-5185025703322080110-n.jpg'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('pub?output=csv') || e.request.url.includes('get-products')) return;
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
            if (resp.status === 200 && e.request.url.startsWith('http')) {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            }
            return resp;
        }).catch(() => caches.match('/index.html')))
    );
});
