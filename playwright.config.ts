import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export const BASE_URL = process.env.PORTE_BASE_URL ?? 'https://porte-mvp.vercel.app';

export default defineConfig({
  testDir: './tests',
  // La app corre sobre datos de producción: se ejecuta en serie para no
  // generar registros concurrentes ni condiciones de carrera entre tests.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0, // los reintentos ocultarían DEF-03, que es justamente intermitente
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 40_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
