import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { restoreSession } from './session.js';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const ok = (data) => Response.json({ statusCode: 200, data });
const unauthorized = () => Response.json({ message: 'Sem sessão' }, { status: 401 });

test('F5 recupera token, usuário e MFA via bootstrap com cookie', async () => {
  const session = { accessToken: 'new-token', user: { role: 'DONO', mfaAtivo: true } };
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/auth/session'));
    assert.equal(options.credentials, 'include');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.headers.has('Authorization'), false);
    return ok(session);
  };
  assert.deepEqual(await restoreSession(), session);
});

test('sem login consulta a sessão uma vez sem disparar refresh', async () => {
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    assert.equal(new URL(url).pathname, '/auth/session');
    return ok({ accessToken: null, user: null });
  };
  assert.equal(await restoreSession(), null);
  assert.equal(calls, 1);
});

test('admin usa escopo próprio e rejeita resposta de tenant', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).searchParams.get('scope'), 'admin');
    return ok({ accessToken: 'tenant', user: { role: 'DONO' } });
  };
  await assert.rejects(restoreSession('admin'), { status: 401 });
});

test('sessão vencida propaga 401 e falha de rede não dispara refresh', async () => {
  globalThis.fetch = async () => unauthorized();
  await assert.rejects(restoreSession(), { status: 401 });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new TypeError('offline');
  };
  await assert.rejects(restoreSession('tenant', { wait: async () => {} }), {
    code: 'NETWORK_ERROR',
  });
  assert.equal(calls, 4);
});

test('reinício do backend: falha de conexão e 503 são seguidos pela restauração', async () => {
  let calls = 0;
  const delays = [];
  const session = { accessToken: 'restored', user: { role: 'MASTER' } };
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).searchParams.get('scope'), 'admin');
    calls++;
    if (calls === 1) {
      throw new TypeError('connection refused');
    }
    if (calls === 2) {
      return Response.json({ message: 'Reiniciando' }, { status: 503 });
    }
    return ok(session);
  };
  assert.deepEqual(await restoreSession('admin', { wait: async (ms) => delays.push(ms) }), session);
  assert.deepEqual(delays, [300, 1000]);
  assert.equal(calls, 3);
});

test('falha de schema não dispara tentativas que não podem resolver o erro', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json(
      { code: 'CRM_SCHEMA_INCOMPATIBLE', message: 'Schema incompatível' },
      { status: 503 },
    );
  };
  await assert.rejects(restoreSession(), { code: 'CRM_SCHEMA_INCOMPATIBLE' });
  assert.equal(calls, 1);
});
