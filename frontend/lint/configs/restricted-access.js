import { defineConfig } from 'eslint/config'

const storageNames = ['localStorage', 'sessionStorage']
const storageMessage = 'Use browserStorage of @/shared/lib/storage, or persistStorage for a store.'

export default defineConfig([
  {
    // Browser storage is read and written through src/shared/lib/storage/browser-storage.utils.ts
    // only, which handles storage that is missing, blocked or full.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: ['src/shared/lib/storage/browser-storage.utils.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...storageNames.map((name) => ({ name, message: storageMessage })),
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read an environment variable through env of @/shared/config/env.',
        },
        ...['window', 'globalThis', 'self'].flatMap((object) =>
          storageNames.map((property) => ({ object, property, message: storageMessage })),
        ),
      ],
    },
  },
])
