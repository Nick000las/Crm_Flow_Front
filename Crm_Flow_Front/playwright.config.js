import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, trace: 'retain-on-failure' },
  webServer: {
    command:
      'pnpm exec vite build --outDir dist-e2e && pnpm exec vite preview --outDir dist-e2e --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    timeout: 60000,
    env: { VITE_API_URL: 'http://127.0.0.1:4173/api' },
  },
});
