/**
 * @file Implementa a integração de service worker, na área de aplicação, mantendo seus recursos
 * e contratos compartilhados.
 */
// Substituído pelo build: somente arquivos públicos emitidos, nunca respostas da API.
const BUILD = /* @pwa-build */ { cacheName: 'flow-crm-static-development', assets: [] };
const CACHE_PREFIX = 'flow-crm-static-';
const urls = new Set(BUILD.assets.map((asset) => new URL(asset, self.location.origin).href));
const shellUrl = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(BUILD.cacheName)
      .then((cache) =>
        cache.addAll(
          BUILD.assets.map((asset) => new Request(asset, { credentials: 'omit', cache: 'reload' })),
        ),
      ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = (await caches.keys()).filter(
        (key) => key.startsWith(CACHE_PREFIX) && key !== BUILD.cacheName,
      );

      // Uma versão anterior atende chunks de abas ainda abertas, sem descartar rascunhos.
      await Promise.all(keys.slice(0, -1).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE_UPDATE') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    /\/(?:api|auth|socket\.io)(?:\/|$)/.test(url.pathname) ||
    request.headers.has('authorization')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        async () => (await caches.match(shellUrl, { ignoreVary: true })) ?? Response.error(),
      ),
    );

    return;
  }

  const currentAsset = urls.has(url.href);
  const previousChunk =
    !url.search && /\/assets\/[^/]+-[\w-]+\.(?:js|css|woff2)$/.test(url.pathname);

  if (!currentAsset && !previousChunk) {
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreVary: true });

      if (cached) {
        return cached;
      }

      const response = await fetch(request);

      if (currentAsset && response.ok && response.type === 'basic') {
        const cache = await caches.open(BUILD.cacheName);

        await cache.put(request, response.clone());
      }

      return response;
    })(),
  );
});
