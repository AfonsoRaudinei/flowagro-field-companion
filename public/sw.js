/**
 * FlowAgro Service Worker - Fase 2 Otimização
 * Cache inteligente para melhor performance
 */

const CACHE_NAME = 'flowagro-v2.1.0';
const DYNAMIC_CACHE = 'flowagro-dynamic-v1.0.0';

// Arquivos essenciais para cache imediato
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/assets/flowagro-logo.jpg',
  '/assets/tela-inicial-background.jpg'
];

// Estratégias de cache por tipo
const CACHE_STRATEGIES = {
  // Cache First - Assets estáticos
  CACHE_FIRST: [
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
    /\/assets\//
  ],
  
  // Network First - API calls
  NETWORK_FIRST: [
    /\/api\//,
    /supabase\.co/,
    /\.agromonitoring\.com/
  ],
  
  // Stale While Revalidate - Páginas
  STALE_WHILE_REVALIDATE: [
    /\/dashboard/,
    /\/profile/,
    /\/settings/
  ]
};

// Install event - Cache assets essenciais
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - Intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    handleFetchWithStrategy(request)
  );
});

async function handleFetchWithStrategy(request) {
  const url = request.url;
  
  try {
    // Cache First Strategy
    if (shouldUseCacheFirst(url)) {
      return await cacheFirstStrategy(request);
    }
    
    // Network First Strategy
    if (shouldUseNetworkFirst(url)) {
      return await networkFirstStrategy(request);
    }
    
    // Stale While Revalidate Strategy
    if (shouldUseStaleWhileRevalidate(url)) {
      return await staleWhileRevalidateStrategy(request);
    }
    
    // Default: Network with cache fallback
    return await networkWithCacheFallback(request);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return await getCacheOrOfflineFallback(request);
  }
}

// Cache First Strategy - Para assets estáticos
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Se está no cache, retorna imediatamente
    return cachedResponse;
  }
  
  // Se não está no cache, busca da rede e adiciona ao cache
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network failed for cache-first:', error);
    throw error;
  }
}

// Network First Strategy - Para APIs
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy - Para páginas
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  // Busca da rede em paralelo para atualizar o cache
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => null);
  
  // Retorna o cache imediatamente se disponível
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Se não há cache, espera a rede
  return await networkPromise;
}

// Network with Cache Fallback - Estratégia padrão
async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Fallback para quando não há cache nem rede
async function getCacheOrOfflineFallback(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Página offline básica para navegação
  if (request.mode === 'navigate') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FlowAgro - Offline</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
            }
            .offline-message { text-align: center; }
            .retry-btn {
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>🌱 FlowAgro</h1>
            <h2>Você está offline</h2>
            <p>Verifique sua conexão com a internet</p>
            <button class="retry-btn" onclick="location.reload()">Tentar novamente</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Offline', { status: 503 });
}

// Helper functions para determinar estratégia
function shouldUseCacheFirst(url) {
  return CACHE_STRATEGIES.CACHE_FIRST.some(pattern => pattern.test(url));
}

function shouldUseNetworkFirst(url) {
  return CACHE_STRATEGIES.NETWORK_FIRST.some(pattern => pattern.test(url));
}

function shouldUseStaleWhileRevalidate(url) {
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE.some(pattern => pattern.test(url));
}

// Background sync para quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      // Aqui seria implementada a sincronização de dados pendentes
      syncPendingData()
    );
  }
});

async function syncPendingData() {
  try {
    // Implementar sincronização de dados offline
    console.log('[SW] Syncing pending data...');
    
    // Exemplo: sincronizar mensagens pendentes
    const pendingMessages = await getStoredPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        await sendMessage(message);
        await removePendingMessage(message.id);
      } catch (error) {
        console.error('[SW] Failed to sync message:', error);
      }
    }
    
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Placeholder functions para sincronização
async function getStoredPendingMessages() {
  // Implementar busca de mensagens pendentes no IndexedDB
  return [];
}

async function sendMessage(message) {
  // Implementar envio de mensagem para API
  return fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify(message),
    headers: { 'Content-Type': 'application/json' }
  });
}

async function removePendingMessage(messageId) {
  // Implementar remoção de mensagem do IndexedDB
  return true;
}

// Message listener para comunicação com a app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});