import { defineConfig, devices } from '@playwright/test'

import {
  backendPort,
  backendUrl,
  databaseFile,
  frontendPort,
  frontendUrl,
  storageStatePath,
} from './tests/shared/backend-env.constants'

// The specs import the config of the app, which reads NODE_ENV; see playwright.config.ts.
const env = process.env as { NODE_ENV?: string }
env.NODE_ENV ||= 'development'

const uv = 'uv run --python 3.13 python'

/**
 * The tests of the pages against the real backend: it starts the backend on a database made from
 * the demo seed, which answers with the scripted model and the fixture corpus (no gateway key, no
 * cost), and the app proxied to it. The specs share one account and one database, so one worker
 * runs them, and each test makes the project it needs.
 */
export default defineConfig({
  testDir: './tests/e2e',
  // The specs of the pages that need the real backend are named <feature>-backend.spec.ts.
  testMatch: '**/*-backend.spec.ts',
  globalSetup: './tests/shared/global-setup.utils.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: frontendUrl,
    storageState: storageStatePath,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // The seed replays the scripted storyline once, then the API serves it.
      command: `sh -c "${uv} scripts/seed_demo.py --reset && ${uv} scripts/serve_demo.py --port ${String(backendPort)}"`,
      cwd: '../backend',
      url: `${backendUrl}/health`,
      // The database is made again at each start, so a server that is up already is not reused.
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: `sqlite:///${databaseFile}`,
        CSRF_ALLOWED_ORIGINS: JSON.stringify([frontendUrl]),
      },
    },
    {
      command: `pnpm exec next dev --port ${String(frontendPort)}`,
      url: frontendUrl,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { API_PROXY_TARGET: backendUrl },
    },
  ],
})
