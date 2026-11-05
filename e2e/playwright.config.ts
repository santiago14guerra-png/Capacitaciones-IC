import { defineConfig } from '@playwright/test';

const URL_LOCAL = 'http://127.0.0.1:5173';

/** Levanta la app en local, con datos emulados. No necesita cuenta de AWS. */
export default defineConfig({
  testDir: 'pruebas',
  timeout: 60_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: URL_LOCAL, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev',
    cwd: '..',
    // Pasa por el proxy de Vite: responde solo cuando el sitio y la API están listos.
    url: `${URL_LOCAL}/api/salud`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
