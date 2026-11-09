import { defineConfig } from '@playwright/test';

const URL_LOCAL = 'http://127.0.0.1:5173';

/**
 * Levanta la app en local, con datos emulados. No necesita cuenta de AWS.
 * Cada servidor se escucha en 127.0.0.1 de forma explícita: en Linux, «localhost» puede quedar
 * solo en IPv6 y Playwright no encontraría el sitio.
 */
export default defineConfig({
  testDir: 'pruebas',
  timeout: 60_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: URL_LOCAL, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npm run dev --workspace api',
      cwd: '..',
      url: 'http://127.0.0.1:3001/api/salud',
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      stdout: 'pipe',
    },
    {
      command: 'npx vite --host 127.0.0.1 --port 5173 --strictPort',
      cwd: '../web',
      url: URL_LOCAL,
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      stdout: 'pipe',
    },
  ],
});
