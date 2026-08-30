import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createAuthSession } from './create-auth-session.js';
import { createQueryClient } from '../lib/query-client.js';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const ok = (data) => Response.json({ statusCode: 200, data });
const unauthorized = () => Response.json({ message: 'Expirado' }, { status: 401 });
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function session(options = {}) {
  const factory = createAuthSession({
    nome: 'Test',
    persistente: true,
    resolverUsuario: async () => ({ role: 'DONO' }),
    ...options,
  });
  let value;
  function Capture() {
    value = factory.useSession();
    return null;
  }
  // SSR fornece os callbacks reais sem disparar a restauração de montagem.
  renderToString(createElement(factory.Provider, null, createElement(Capture)));
  return value;
}

test('login antigo que falha não encerra a conta autenticada depois dele', async () => {
  const old = deferred();
  const auth = session({
    resolverUsuario: (token) => (token === 'old' ? old.promise : { role: 'DONO' }),
  });
  const first = auth.login({ accessToken: 'old' });
  const rejected = assert.rejects(first, /Falhou/);
  await auth.login({ accessToken: 'new' });
  old.reject(new Error('Falhou'));
  await rejected;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get('Authorization'), 'Bearer new');
    return ok({ loaded: true });
  };
  await auth.authApi.get('/check');
});

test('login pendente não pode restaurar a sessão após logout', async () => {
  const pending = deferred();
  const auth = session({ resolverUsuario: () => pending.promise });
  const login = auth.login({ accessToken: 'old' });
  const rejected = assert.rejects(login, { name: 'AbortError' });
  globalThis.fetch = async () => ok({});
  await auth.logout();
  pending.resolve({ role: 'DONO' });
  await rejected;
});

test('troca de conta e logout limpam dados de consultas e mutações anteriores', async () => {
  const client = createQueryClient();
  const auth = session({ onSessionChange: () => client.clear() });
  client.setQueryData(['crm', 'leads'], { nome: 'Outra empresa' });
  client.getMutationCache().build(client, { mutationKey: ['crm', 'export'] });
  await auth.login({ accessToken: 'new' });
  assert.equal(client.getQueryCache().getAll().length, 0);
  assert.equal(client.getMutationCache().getAll().length, 0);
  client.setQueryData(['notificacoes'], { naoLidas: 4 });
  globalThis.fetch = async () => ok({});
  await auth.logout();
  assert.equal(client.getQueryCache().getAll().length, 0);
});

test('falha operacional no refresh não descarta o token da sessão', async () => {
  const auth = session();
  await auth.login({ accessToken: 'valid-session' });
  globalThis.fetch = async (url) =>
    url.endsWith('/auth/refresh')
      ? Response.json({ message: 'Indisponível' }, { status: 503 })
      : unauthorized();
  await assert.rejects(auth.authApi.get('/protected'), { status: 401 });
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get('Authorization'), 'Bearer valid-session');
    return ok({});
  };
  await auth.authApi.get('/check');
});

test('401 atrasado reutiliza token renovado sem fazer outro refresh', async () => {
  const auth = session();
  await auth.login({ accessToken: 'old' });
  const delayed = deferred();
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      return ok({ accessToken: 'new' });
    }
    if (options.headers.get('Authorization') === 'Bearer new') {
      return ok({ loaded: true });
    }
    if (url.endsWith('/delayed')) {
      return delayed.promise;
    }
    return unauthorized();
  };
  const first = auth.authApi.get('/delayed');
  await auth.authApi.get('/fast');
  delayed.resolve(unauthorized());
  assert.deepEqual(await first, { loaded: true });
  assert.equal(refreshes, 1);
});

test('resposta de consulta pendente é descartada depois de sair', async () => {
  const auth = session();
  await auth.login({ accessToken: 'old' });
  const delayed = deferred();
  globalThis.fetch = async (url) => (url.endsWith('/auth/logout') ? ok({}) : delayed.promise);
  const request = auth.authApi.get('/leads');
  const rejected = assert.rejects(request, { name: 'AbortError' });
  await auth.logout();
  delayed.resolve(ok({ nome: 'Dados antigos' }));
  await rejected;
});

test('login sem usuário ou sem token válido é rejeitado', async () => {
  const auth = session({ resolverUsuario: async () => null });
  await assert.rejects(auth.login({}), { code: 'AUTH_TOKEN_INVALID' });
  await assert.rejects(auth.login({ accessToken: 'token' }), { code: 'AUTH_TOKEN_INVALID' });
});

test('segundo 401 após refresh encerra a sessão sem novas tentativas', async () => {
  const auth = session();
  await auth.login({ accessToken: 'old' });
  let refreshes = 0;
  let requests = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      return ok({ accessToken: 'rejected' });
    }
    requests++;
    return unauthorized();
  };
  await assert.rejects(auth.authApi.get('/protected'), { status: 401 });
  assert.equal(refreshes, 1);
  assert.equal(requests, 2);
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.has('Authorization'), false);
    return ok({});
  };
  await auth.authApi.get('/check');
});
