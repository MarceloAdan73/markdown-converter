// Service Worker para Markdown Converter PWA
const CACHE_NAME = 'markdown-converter-v1.0.1';
const APP_VERSION = '1.0.1';

// Recursos a cachear
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando versión', APP_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando recursos estáticos');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Error durante la instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando versión', APP_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activación completada');
      return self.clients.claim();
    })
  );
});

// Estrategia de cache: Network First para HTML, Cache First para recursos estáticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Para API calls y recursos dinámicos, usar network first
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si está en cache y es un recurso estático, usarlo
        if (cachedResponse && isStaticAsset(url)) {
          return cachedResponse;
        }
        
        // Si no está en cache o es HTML, intentar red
        return fetch(event.request)
          .then((response) => {
            // Cachear respuesta válida
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback a cache si hay error de red
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Fallback para página principal si es una navegación
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            return new Response('Sin conexión', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Función para identificar recursos estáticos
function isStaticAsset(url) {
  return url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.json') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.includes('/static/');
}

// Mensajes desde la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    });
  }
});
