import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Unit tests run in Vitest (jsdom), independent of the Next.js build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/vitest.setup.ts', './src/test/zustand.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
    // Every test starts with the calls of the mocks cleared, the spies restored, and the values set
    // with `vi.stubEnv` and `vi.stubGlobal` put back, so that no test has to do it for itself.
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    // Dates show in the time zone of the machine; the tests fix it, so that they give the same
    // result on every machine.
    env: { TZ: 'UTC' },
  },
})
