/**
 * @file Estado de instalação e atualização, sem persistir sessão ou dados do CRM.
 */
/** Estado de instalação e atualização, sem persistir sessão ou dados do CRM. */
export function createPwaStore({
  browserWindow,
  browserNavigator,
  enabled = true,
  base = '/',
} = {}) {
  const listeners = new Set();
  const displayMode = browserWindow?.matchMedia?.('(display-mode: standalone)');
  let state = {
    online: browserNavigator?.onLine !== false,
    installed: Boolean(displayMode?.matches || browserNavigator?.standalone),
    installAvailable: false,
    updateAvailable: false,
  };
  let prompt;
  let registration;
  let started = false;
  let reloadApproved = false;
  const publish = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  function start() {
    if (started || !browserWindow || !enabled) {
      return;
    }

    started = true;
    browserWindow.addEventListener('online', () => publish({ online: true }));
    browserWindow.addEventListener('offline', () => publish({ online: false }));

    browserWindow.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      prompt = event;
      publish({ installAvailable: true });
    });

    browserWindow.addEventListener('appinstalled', () => {
      prompt = undefined;
      publish({ installed: true, installAvailable: false });
    });

    displayMode?.addEventListener('change', (event) => publish({ installed: event.matches }));

    if (!browserWindow.isSecureContext || !browserNavigator?.serviceWorker) {
      return;
    }

    browserNavigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadApproved) {
        reloadApproved = false;
        browserWindow.location.reload();
      }
    });

    browserNavigator.serviceWorker
      .register(`${base}sw.js`, { scope: base, updateViaCache: 'none' })
      .then((result) => {
        registration = result;

        if (result.waiting) {
          publish({ updateAvailable: true });
        }

        result.addEventListener('updatefound', () => {
          const worker = result.installing;

          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && browserNavigator.serviceWorker.controller) {
              publish({ updateAvailable: true });
            }
          });
        });

        browserWindow.addEventListener('focus', () => {
          if (browserNavigator.onLine !== false) {
            result.update().catch(() => {});
          }
        });
      })
      .catch(() => {
        /* Instalação é melhoria progressiva: o app online continua disponível. */
      });
  }

  return {
    start,
    subscribe(listener) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    async install() {
      if (!prompt || state.installed) {
        return false;
      }

      const current = prompt;

      prompt = undefined;
      publish({ installAvailable: false });

      try {
        await current.prompt();

        const result = await current.userChoice;

        return result.outcome === 'accepted';
      } catch {
        return false;
      }
    },
    activateUpdate() {
      if (!registration) {
        return false;
      }

      if (!registration.waiting) {
        // Outra aba pode já ter ativado a versão; a confirmação ainda autoriza recarregar.
        browserWindow.location.reload();

        return true;
      }

      reloadApproved = true;
      registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });

      return true;
    },
  };
}

export const pwaStore = createPwaStore({
  browserWindow: typeof window === 'undefined' ? undefined : window,
  browserNavigator: typeof navigator === 'undefined' ? undefined : navigator,
  enabled: import.meta.env?.PROD,
  base: import.meta.env?.BASE_URL ?? '/',
});
