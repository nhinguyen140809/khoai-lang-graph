import { cpus } from 'node:os'

import { defineConfig, devices } from '@playwright/test'

import e2e from './playwright.config'

const themes = ['light', 'dark'] as const

/** The windows that each state is taken in, by name: three desktop sizes, from the widest, and a phone. */
const windows = {
  wide: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
  // A laptop screen of 1920 by 1080 at a scale of 125%, in a maximized browser: 1536 by 864
  // points, less the taskbar and the bars of the browser.
  laptop: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1536, height: 730 },
    deviceScaleFactor: 1.25,
  },
  small: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } },
  phone: devices['Pixel 7'],
}

const baseURL = e2e.use?.baseURL ?? ''

/**
 * Takes a screenshot of each state of each page, as its spec reaches it, in each window and each
 * theme, into screenshots/<window>-<theme>/. It starts the same dev server with mocks as the E2E
 * tests, or uses the one that runs on its port.
 */
export default defineConfig({
  ...e2e,
  testDir: './tests/screenshots',
  // The first visit to a page waits for the dev server to compile it.
  timeout: 60_000,
  retries: 1,
  // One browser for every two cores on a developer machine, so a small machine still runs one at a
  // time while a large one fills itself; CI keeps its own default of the same shape.
  ...(process.env.CI ? {} : { workers: Math.max(1, Math.floor(cpus().length / 2)) }),
  projects: Object.entries(windows).flatMap(([window, device]) =>
    themes.map((theme) => ({
      name: `${window}-${theme}`,
      use: {
        ...device,
        // The app keeps the theme chosen by the user under this key, and starts dark without it.
        storageState: {
          cookies: [],
          origins: [{ origin: baseURL, localStorage: [{ name: 'theme', value: theme }] }],
        },
      },
    })),
  ),
})
