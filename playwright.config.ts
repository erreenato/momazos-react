import { defineConfig, devices } from '@playwright/test';
import { FRONTEND_URL, IS_DEPLOYED, LOCAL_API_URL, LOCAL_FRONTEND_URL } from './e2etests/support/env';

export default defineConfig({
  testDir: './e2etests',

  // Todas las pruebas comparten una misma base de datos: corren una a la vez.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Se omite al probar el despliegue (E2E_BASE_URL).
  // reuseExistingServer = false: si ya tienes `npm run dev` abierto, ciérralo antes
  // (los puertos 4000 y 5173 deben estar libres).
  webServer: IS_DEPLOYED
    ? undefined
    : [
        {
          // MongoDB efímera en memoria, ya sembrada (backend/src/scripts/devMemory.ts).
          // La primera vez descarga el binario de MongoDB, por eso el timeout largo.
          command: 'npm run dev:backend:memory',
          url: 'http://localhost:4000/api/health',
          env: {
            PORT: '4000',
            FRONTEND_URL: LOCAL_FRONTEND_URL,
            JWT_SECRET: 'secreto-solo-para-pruebas-e2e',
          },
          reuseExistingServer: false,
          timeout: 180_000,
        },
        {
          command: 'npm run dev:frontend',
          url: LOCAL_FRONTEND_URL,
          // Así no depende de frontend/.env.
          env: { VITE_API_URL: LOCAL_API_URL },
          reuseExistingServer: false,
          timeout: 120_000,
        },
      ],
});
