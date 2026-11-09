import { defineConfig } from 'eslint/config'

const storageNames = ['localStorage', 'sessionStorage']
const storageMessage = 'Use browserStorage of @/shared/lib/storage, or persistStorage for a store.'

// The browser globals, and the one file that owns each of them: a component names the act it wants,
// never the global it happens to reach.
const environmentGlobals = [
  'window',
  'document',
  'navigator',
  'history',
  'alert',
  'confirm',
  'prompt',
]
const environmentMessage = 'Use the hook or the util of shared/lib that owns this browser thing.'
const historyMessage =
  'The router owns the address; a full load goes through reloadTo of @/shared/lib/url.'
const dialogMessage = 'The app asks through its dialogs and toasts.'

// The methods that write a number, a date or a word in the locale of the environment, and the one
// place that decides the locale: the formatters of shared/lib on formatLocale.
const localeMethods = [
  'toLocaleString',
  'toLocaleDateString',
  'toLocaleTimeString',
  'toLocaleUpperCase',
  'toLocaleLowerCase',
]
const localeMessage = 'Write the text through the formatters of @/shared/lib on formatLocale.'

// The files that own an access: the missing cases live there, with the server render and the
// cleanup of the listeners, and no rule bans the global in its owner. The tests read the
// environment as their tool, so the rules leave them out too.
const environmentOwners = [
  'src/shared/lib/viewport/focus.utils.ts',
  'src/shared/lib/viewport/scroll.utils.ts',
  'src/shared/lib/viewport/hooks/useScrollIntoViewById.ts',
  'src/shared/lib/viewport/hooks/useIsMobile.ts',
  'src/shared/lib/viewport/hooks/usePrefersReducedMotion.ts',
  'src/shared/lib/hotkey/hooks/useModifierKeyName.ts',
  'src/shared/lib/clipboard/hooks/useClipboard.ts',
  'src/shared/components/frame/commands/hooks/useCommands.ts',
  'src/shared/lib/storage/browser-storage.utils.ts',
  'src/shared/lib/url/reload.utils.ts',
  'src/shared/api/request/api-url.utils.ts',
  'src/shared/routes/auth/auth-redirect.utils.ts',
  'src/shared/components/ui/sidebar.tsx',
  'src/modules/design-system/widgets/showcase/components/cards/CommandCard.tsx',
  'src/test/msw/scenario-address.utils.ts',
  'src/mocks/shared/scenario/mock-scenario.utils.ts',
  'src/test/**',
  'src/**/__tests__/**',
  'tests/**',
]

// The files that write a number, a date or a word in the locale of the app, and the storage owner,
// which keeps the storage rule of the block above for itself.
const localeOwners = [
  'src/shared/config/locale/**',
  'src/shared/lib/numbers/formatters.utils.ts',
  'src/shared/lib/time/formatters.utils.ts',
  'src/shared/lib/text/list.utils.ts',
  'src/shared/lib/text/plural.utils.ts',
  'src/shared/components/form/number/number-input.utils.ts',
  'src/shared/components/ui/chart.tsx',
  'src/shared/components/ui/calendar.tsx',
  'src/shared/lib/storage/browser-storage.utils.ts',
]

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
  {
    // A later block replaces the whole list of a rule it sets, so this block keeps the storage
    // names of the block above: the browser globals are banned outside the files that own them.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: environmentOwners,
    rules: {
      'no-restricted-globals': [
        'error',
        ...storageNames.map((name) => ({ name, message: storageMessage })),
        ...environmentGlobals.map((name) => ({
          name,
          message:
            name === 'history'
              ? historyMessage
              : name === 'alert' || name === 'confirm' || name === 'prompt'
                ? dialogMessage
                : environmentMessage,
        })),
      ],
    },
  },
  {
    // The same for the writing of a value in the locale of the environment: the formatters own it.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: localeOwners,
    rules: {
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
        { object: 'Intl', message: localeMessage },
        ...localeMethods.map((property) => ({ property, message: localeMessage })),
      ],
    },
  },
])
