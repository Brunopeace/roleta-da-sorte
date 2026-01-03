const CACHE_NAME = 'giro-da-sorte-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/mp3/roleta.mp3',
  '/css/styles.css',
  '/css/adm.css',
  '/js/adm.js',
  '/js/script.js',
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png',
];

// Instalação: Salva arquivos estáticos no Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos se houver atualização
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Estratégia: Tenta carregar da rede, se falhar (offline), busca no cache
self.addEventListener('fetch', (event) => {
  // Ignora requisições do Firebase (RTDB/Auth) para não dar conflito com o banco real
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});