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
    projects: [
      {
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          setupFiles: ['./src/test/vitest.setup.ts', './src/test/zustand.setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          css: true,
          // Every test starts with the calls of the mocks cleared, the spies restored, and the
          // values set with `vi.stubEnv` and `vi.stubGlobal` put back, so that no test has to do it
          // for itself.
          clearMocks: true,
          restoreMocks: true,
          unstubEnvs: true,
          unstubGlobals: true,
          // Dates show in the time zone of the machine; the tests fix it, so that they give the
          // same result on every machine.
          env: { TZ: 'UTC' },
        },
      },
      {
        // The ESLint config in lint/ runs in Node.js and needs neither the DOM nor the test setup.
        // The rules that read types build a TypeScript program on their first test, which takes
        // longer than the default 5 seconds when the machine is busy.
        test: {
          name: 'lint',
          environment: 'node',
          include: ['lint/**/*.test.js'],
          testTimeout: 30_000,
        },
      },
    ],
    // Run with `pnpm test:coverage`. The report counts the code of the app that the unit tests are
    // for, not the files that only Next.js, the E2E tests or the design system run.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/app/**',
        'src/mocks/**',
        'src/test/**',
        'src/shared/components/ui/**',
        'src/modules/design-system/**',
      ],
      reporter: ['text-summary', 'json-summary'],
    },
  },
})
