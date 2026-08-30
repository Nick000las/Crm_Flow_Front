import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { renderServiceWorker } from '../../build/pwa-plugin.js';

function worker({
  fetch = async () => new Response('online'),
  cacheMatch = async () => undefined,
} = {}) {
  const handlers = new Map();
  const installedRequests = [];
  let activations = 0;
  const self = {
    location: { origin: 'https://flow.example' },
    registration: { scope: 'https://flow.example/' },
    clients: { claim: async () => {} },
    skipWaiting: () => activations++,
    addEventListener: (type, callback) => handlers.set(type, callback),
  };
  const caches = {
    match: cacheMatch,
    open: async () => ({
      addAll: async (requests) => installedRequests.push(...requests),
      put: async () => {},
    }),
    keys: async () => [],
    delete: async () => true,
  };
  const bundle = {
    'assets/app-hashed.js': { type: 'chunk' },
    'index.html': { source: '<html></html>' },
  };

  // Resolve relative precache requests like a browser worker, rather than Node's URL-less Request.
  class BrowserRequest extends Request {
    constructor(url, options) {
      super(new URL(url, self.location.origin), options);
    }
  }

  runInNewContext(renderServiceWorker(bundle), {
    self,
    caches,
    fetch,
    URL,
    Request: BrowserRequest,
    Response,
  });

  return {
    handlers,
    installedRequests,
    get activations() {
      return activations;
    },
  };
}

function fetchEvent(url, options = {}) {
  let response;

  return {
    request: new Request(url, options),
    respondWith: (promise) => {
      response = promise;
    },
    get response() {
      return response;
    },
  };
}

test('API, sessão, autorização, outros domínios e gravações não são interceptados', () => {
  const sw = worker();

  for (const event of [
    fetchEvent('https://flow.example/api/crm/leads'),
    fetchEvent('https://flow.example/auth/session'),
    fetchEvent('https://flow.example/crm/leads/search', { method: 'POST', body: '{}' }),
    fetchEvent('https://flow.example/assets/app-hashed.js', {
      headers: { authorization: 'Bearer secret' },
    }),
    fetchEvent('https://api.example/crm/leads'),
    fetchEvent('https://flow.example/crm/leads'),
  ]) {
    sw.handlers.get('fetch')(event);
    assert.equal(event.response, undefined);
  }
});

test('arquivos públicos são pré-carregados sem cookies e worker não ativa sem aprovação', async () => {
  const sw = worker();
  let installed;

  sw.handlers.get('install')({
    waitUntil: (promise) => {
      installed = promise;
    },
  });

  await installed;
  assert.ok(sw.installedRequests.some((request) => request.url.endsWith('/index.html')));
  assert.ok(sw.installedRequests.every((request) => request.credentials === 'omit'));
  assert.equal(sw.activations, 0);
  sw.handlers.get('message')({ data: { type: 'OTHER' } });
  assert.equal(sw.activations, 0);
  sw.handlers.get('message')({ data: { type: 'ACTIVATE_UPDATE' } });
  assert.equal(sw.activations, 1);
});

test('asset disponível em cache funciona offline e ignora Vary apenas para estáticos permitidos', async () => {
  const sw = worker({
    fetch: async () => {
      throw new Error('offline');
    },
    cacheMatch: async (_request, options) => {
      assert.equal(options.ignoreVary, true);

      return new Response('cached script');
    },
  });
  const event = fetchEvent('https://flow.example/assets/app-hashed.js');

  sw.handlers.get('fetch')(event);
  assert.equal(await (await event.response).text(), 'cached script');
});

test('manifesto fornece ícones regulares, maskable e inicialização standalone', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../../public/manifest.webmanifest', import.meta.url)),
  );

  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/dashboard');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'));
});
