import { defineConfig, devices } from '@playwright/test'

// The specs import the config of the app, which reads NODE_ENV, and Playwright leaves it as the
// shell has it (often nothing); the runner fills it the way a plain `next dev` does.
const env = process.env as { NODE_ENV?: string }
env.NODE_ENV ||= 'development'

const PORT = 3100

export default defineConfig({
  testDir: './tests/e2e',
  // The specs that need the real backend run with `pnpm e2e:backend`.
  testIgnore: '**/*-backend.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // The dev server renders a page on the first visit, which can be slow.
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // E2E runs against the MSW mocks so it does not need the backend.
  webServer: {
    command: `pnpm exec next dev --port ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_API_MOCKING: 'enabled' },
  },
})
