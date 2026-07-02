// Service Worker - Carteirinha Estudantil PWA
// Estratégia: Cache-first para assets estáticos, fallback offline

const CACHE_NAME = 'cie-pwa-v1';

const ASSETS_TO_CACHE = [
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/storageManager.js',
  './js/cardManager.js',
  './js/formManager.js',
  './js/qrManager.js',
  './js/navigationManager.js',
  './manifest.json',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
  './assets/images/logo-abofe.png',
  './assets/images/logo-abofe.svg',
  './assets/images/logo-abafe.svg',
  './assets/images/logo-cie.svg',
  './assets/images/selo-2026.png',
  './assets/images/selo-2026.svg',
  './assets/images/foto-generica.svg',
  './assets/images/card-bg.svg',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js'
];

// Evento install: pre-cache de todos os assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Evento activate: limpar caches antigos e tomar controle dos clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Evento fetch: cache-first com fallback offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            // Só faz cache de respostas válidas
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clona a resposta para armazenar no cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Offline e recurso não está no cache
            if (event.request.mode === 'navigate') {
              // Requisição de navegação HTML: retornar página offline
              return new Response(
                buildOfflinePage(),
                {
                  headers: { 'Content-Type': 'text/html; charset=UTF-8' }
                }
              );
            }

            // Para outros recursos (CSS, JS, imagens): falha silenciosa
            return undefined;
          })
      )
  );
});

/**
 * Gera HTML de fallback offline para primeiro acesso sem cache.
 * @returns {string} HTML da página offline
 */
function buildOfflinePage() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1a6b5a">
  <title>CIE - Sem Conexão</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 24px;
    }
    .offline-container {
      text-align: center;
      max-width: 320px;
    }
    .offline-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .offline-title {
      color: #1a6b5a;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .offline-message {
      color: #555;
      font-size: 16px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="offline-icon" aria-hidden="true">&#128268;</div>
    <h1 class="offline-title">Sem conexão</h1>
    <p class="offline-message">É necessário conexão com a internet para o primeiro acesso.</p>
  </div>
</body>
</html>`;
}
