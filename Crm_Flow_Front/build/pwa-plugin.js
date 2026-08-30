import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const PUBLIC_ASSETS = [
  'index.html',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

export function renderServiceWorker(bundle, base = '/') {
  const emitted = Object.keys(bundle)
    .filter((file) => /\.(?:js|css|woff2)$/.test(file))
    .sort();
  const version = createHash('sha256')
    .update(emitted.join('\n'))
    .update(String(bundle['index.html']?.source ?? ''))
    .digest('hex')
    .slice(0, 16);
  const config = {
    cacheName: `flow-crm-static-${version}`,
    assets: [...new Set([...PUBLIC_ASSETS, ...emitted])].map((file) => `${base}${file}`),
  };
  const source = readFileSync(new URL('../src/pwa/service-worker.js', import.meta.url), 'utf8');

  return source.replace(/\/\* @pwa-build \*\/[\s\S]*?;/, `${JSON.stringify(config)};`);
}

export function pwaPlugin() {
  let base = '/';

  return {
    name: 'flow-crm-pwa',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: renderServiceWorker(bundle, base),
        });
      },
    },
  };
}
