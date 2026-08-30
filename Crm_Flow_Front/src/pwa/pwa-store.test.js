import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPwaStore } from './pwa-store.js';

function environment() {
  const browserWindow = new EventTarget();
  const serviceWorker = new EventTarget();
  const registration = new EventTarget();
  const messages = [];
  let reloads = 0;

  registration.waiting = { postMessage: (message) => messages.push(message) };
  registration.update = async () => {};

  serviceWorker.controller = {};
  serviceWorker.register = async () => registration;
  browserWindow.matchMedia = () => ({ matches: false, addEventListener() {} });
  browserWindow.location = { reload: () => reloads++ };
  browserWindow.isSecureContext = true;

  const browserNavigator = { onLine: true, serviceWorker };
  const store = createPwaStore({ browserWindow, browserNavigator });

  return {
    store,
    browserWindow,
    serviceWorker,
    registration,
    messages,
    get reloads() {
      return reloads;
    },
  };
}

test('atualização espera aprovação e mudança de controlador não recarrega rascunhos automaticamente', async () => {
  const env = environment();

  env.store.start();
  await Promise.resolve();
  assert.equal(env.store.getSnapshot().updateAvailable, true);
  env.serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(env.reloads, 0);
  assert.equal(env.store.activateUpdate(), true);
  assert.deepEqual(env.messages, [{ type: 'ACTIVATE_UPDATE' }]);
  env.serviceWorker.dispatchEvent(new Event('controllerchange'));
  env.serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(env.reloads, 1);
});

test('prompt nativo é consumido uma vez e instalação concluída remove oferta', async () => {
  const env = environment();

  env.store.start();

  const event = new Event('beforeinstallprompt', { cancelable: true });
  let prompts = 0;

  event.prompt = async () => prompts++;
  event.userChoice = Promise.resolve({ outcome: 'accepted' });
  env.browserWindow.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(env.store.getSnapshot().installAvailable, true);
  assert.equal(await env.store.install(), true);
  assert.equal(await env.store.install(), false);
  assert.equal(prompts, 1);
  env.browserWindow.dispatchEvent(new Event('appinstalled'));
  assert.equal(env.store.getSnapshot().installed, true);
  assert.equal(env.store.getSnapshot().installAvailable, false);
});

test('mudanças de conectividade notificam a interface e podem ser desassinadas', () => {
  const env = environment();

  env.store.start();

  let changes = 0;
  const unsubscribe = env.store.subscribe(() => changes++);

  env.browserWindow.dispatchEvent(new Event('offline'));
  assert.equal(env.store.getSnapshot().online, false);
  env.browserWindow.dispatchEvent(new Event('online'));
  assert.equal(env.store.getSnapshot().online, true);
  assert.equal(changes, 2);
  unsubscribe();
  env.browserWindow.dispatchEvent(new Event('offline'));
  assert.equal(changes, 2);
});

test('navegadores sem service worker mantêm o site e as instruções de instalação', () => {
  const browserWindow = new EventTarget();
  const store = createPwaStore({ browserWindow, browserNavigator: { onLine: true } });

  assert.doesNotThrow(() => store.start());
  assert.equal(store.activateUpdate(), false);
  assert.equal(store.getSnapshot().installAvailable, false);
});

test('se outra aba ativou a atualização, a recarga continua exigindo aprovação local', async () => {
  const env = environment();

  env.store.start();
  await Promise.resolve();
  env.registration.waiting = null;
  env.serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(env.reloads, 0);
  assert.equal(env.store.activateUpdate(), true);
  assert.equal(env.reloads, 1);
});
