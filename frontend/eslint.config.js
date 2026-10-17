import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextPlugin from '@next/eslint-plugin-next'
import checkFile from 'eslint-plugin-check-file'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// The visible parts of these libraries are wrapped in src/shared/components/ui, where they take
// the design system tokens. Code outside that folder uses the wrappers.
const wrappedLibraryImports = [
  { name: 'streamdown', message: 'Use Markdown from @/shared/components/ui/markdown.' },
  { name: '@streamdown/code', message: 'Use Markdown from @/shared/components/ui/markdown.' },
  {
    name: 'react-resizable-panels',
    message: 'Use the components in @/shared/components/ui/resizable.',
  },
  {
    name: '@xyflow/react',
    importNames: ['default', 'ReactFlow', 'Handle', 'BaseEdge'],
    message:
      'Use Flow from @/shared/components/ui/flow, Handle from @/shared/components/ui/handle, and Edge from @/shared/components/ui/edge.',
  },
  {
    name: 'recharts',
    importNames: ['ResponsiveContainer', 'Tooltip', 'Legend'],
    message: 'Use ChartContainer, ChartTooltip, and ChartLegend from @/shared/components/ui/chart.',
  },
  {
    name: 'sonner',
    importNames: ['Toaster'],
    message: 'Use Toaster from @/shared/components/ui/sonner.',
  },
]

// A topic of the domain is used through its index.ts only, as a feature is.
const domainPatterns = [
  {
    group: ['@/shared/domain/*/**'],
    message:
      'Import a topic of the domain from its index (@/shared/domain/<topic>). Inside the same topic, use a relative import.',
  },
  {
    regex: '^(\\.\\./)+(shared/)?domain/[^/]+/',
    message: 'Import a topic of the domain from its index (@/shared/domain/<topic>).',
  },
]

// A topic of the domain is plain data and functions of the product, so that every layer can
// import it: no React, no state, no call to the API, and no other shared code. How a value is
// shown, such as the color of a status, belongs to a component.
const domainPurePattern = {
  regex: '^(?!\\.|@/shared/domain/)',
  message:
    'A topic of the domain imports only its own files and other topics of the domain (@/shared/domain/<topic>).',
}

const sharedCodePatterns = [
  {
    group: ['@/features', '@/features/**', '@/app/**', '@/providers/**'],
    message:
      'Shared code must not import features or the app layer. Pass feature components in as props from src/app/.',
  },
  {
    regex: '^(\\.\\./)+(features|app|providers)(/|$)',
    message:
      'Shared code must not import features or the app layer. Pass feature components in as props from src/app/.',
  },
  {
    group: ['@/shared/components/frame', '@/shared/components/frame/**'],
    message:
      'Shared code does not import the frame. Inside src/shared/components/frame, use relative imports.',
  },
  ...domainPatterns,
]

// The layers of the frame (README: Frame). A component reaches the state of the frame through
// hooks, a store stands alone so that hooks are the one place that combines stores, and the pure
// files hold no React and no state.
const frameComponentPattern = {
  regex: '\\.store$',
  allowTypeImports: true,
  message:
    'A component of the frame reads and changes its state through the hooks of its folder, not a store.',
}

const frameStorePattern = {
  regex: '\\.store$|/hooks/',
  message: 'A store of the frame imports no other store and no hook. Combine stores in a hook.',
}

const frameHookPattern = {
  regex: '/components/(?!ui/)',
  message: 'A hook of the frame imports no component.',
}

const framePurePaths = [
  {
    name: 'react',
    allowTypeImports: true,
    message: 'A pure file of the frame holds no React code.',
  },
  { name: 'zustand', message: 'A pure file of the frame holds no state.' },
]

const framePurePattern = {
  regex: '\\.store$|/hooks/',
  message: 'A pure file of the frame imports no store and no hook.',
}

const featurePatterns = [
  {
    group: ['@/features', '@/features/**', '@/app/**', '@/providers/**'],
    message:
      'A feature must not import another feature or the app layer. Compose features in src/app/, or move the shared code to src/shared.',
  },
  {
    group: ['@/shared/components/frame/**'],
    message: 'Import the frame from @/shared/components/frame, its index.',
  },
  ...domainPatterns,
]

// The deepest folder of a feature that gets its own rule below, counted from the feature folder.
const FEATURE_FOLDER_DEPTH = 5

// A relative import that climbs out of its feature folder reaches another feature, the app layer
// or shared code. How many `../` that takes depends on how deep the file is, so each depth of
// folder gets its own block.
function featureFolderPatterns(depth) {
  return [
    ...featurePatterns,
    {
      regex: `^(\\.\\./){${String(depth + 1)},}`,
      message:
        'A relative import stays inside its feature. Import shared code with @/shared; another feature or the app layer is not imported.',
    },
  ]
}

const featureFolderBlocks = Array.from({ length: FEATURE_FOLDER_DEPTH + 1 }, (_, depth) => ({
  files: [`src/features/*/${'*/'.repeat(depth)}*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      { paths: wrappedLibraryImports, patterns: featureFolderPatterns(depth) },
    ],
  },
}))

// A component of a feature reaches the API, the cache of the queries and the stores of the
// feature through its hooks, which hold what follows a call. The blocks repeat the rules above,
// since a later block replaces the whole rule.
const featureComponentPatterns = [
  {
    regex: '\\.api$|/shared/api/api-fetch\\.utils$',
    message:
      'A component calls the API through a hook of its feature, which calls <feature>.api.ts.',
  },
  {
    regex: '\\.store$',
    message: 'A component reads and changes a store through a hook of its feature.',
  },
]

const featureComponentPaths = [
  ...wrappedLibraryImports,
  {
    name: '@tanstack/react-query',
    message: 'A component reads the queries and the mutations through a hook of its feature.',
  },
]

const featureComponentBlocks = Array.from({ length: FEATURE_FOLDER_DEPTH }, (_, depth) => ({
  files: [`src/features/*/components/${'*/'.repeat(depth)}*.{ts,tsx}`],
  ignores: ['**/__tests__/**'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: featureComponentPaths,
        patterns: [...featureFolderPatterns(depth + 1), ...featureComponentPatterns],
      },
    ],
  },
}))

export default defineConfig([
  globalIgnores([
    '.next',
    'next-env.d.ts',
    'coverage',
    'playwright-report',
    'test-results',
    'src/shared/api/generated',
    'public/mockServiceWorker.js',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      nextPlugin.configs['core-web-vitals'],
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      // scripts/lint.mjs lints one group of folders per process and names a TypeScript project of
      // that group only; ESLint run by itself, or in the editor, finds the tsconfig.json of the file.
      parserOptions: process.env.ESLINT_TSCONFIG
        ? { project: process.env.ESLINT_TSCONFIG, tsconfigRootDir: import.meta.dirname }
        : { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // A feature is used through its index.ts only (CONTRIBUTING: Feature public API).
      'no-restricted-imports': [
        'error',
        {
          paths: wrappedLibraryImports,
          patterns: [
            {
              group: ['@/features/*/**'],
              message:
                "Import from the feature's index (@/features/<feature>). Inside the same feature, use a relative import.",
            },
            {
              regex: '^(\\.\\./)+(src/)?features/[^/]+/',
              message: "Import from the feature's index (@/features/<feature>).",
            },
            {
              group: ['@/shared/components/frame/**'],
              message: 'Import the frame from @/shared/components/frame, its index.',
            },
            ...domainPatterns,
          ],
        },
      ],
    },
  },
  {
    // Browser storage is read and written through src/shared/lib/browser-storage.utils.ts only, which
    // handles storage that is missing, blocked or full.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: ['src/shared/lib/browser-storage.utils.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['localStorage', 'sessionStorage'].map((name) => ({
          name,
          message: 'Use browserStorage or persistStorage from @/shared/lib/browser-storage.utils.',
        })),
      ],
      'no-restricted-properties': [
        'error',
        ...['window', 'globalThis', 'self'].flatMap((object) =>
          ['localStorage', 'sessionStorage'].map((property) => ({
            object,
            property,
            message:
              'Use browserStorage or persistStorage from @/shared/lib/browser-storage.utils.',
          })),
        ),
      ],
    },
  },
  {
    // Shared code never depends on features or on the app layer (CONTRIBUTING: Import direction).
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: wrappedLibraryImports, patterns: sharedCodePatterns },
      ],
    },
  },
  {
    // The topics of the domain stay pure (CONTRIBUTING: Import direction).
    files: ['src/shared/domain/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: wrappedLibraryImports, patterns: [...sharedCodePatterns, domainPurePattern] },
      ],
    },
  },
  {
    // The layers of the frame: components (README: Frame).
    files: ['src/shared/components/frame/**/*.tsx'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: wrappedLibraryImports, patterns: [...sharedCodePatterns, frameComponentPattern] },
      ],
    },
  },
  {
    // The layers of the frame: hooks.
    files: ['src/shared/components/frame/**/hooks/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: wrappedLibraryImports, patterns: [...sharedCodePatterns, frameHookPattern] },
      ],
    },
  },
  {
    // The layers of the frame: stores.
    files: ['src/shared/components/frame/**/*.store.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: wrappedLibraryImports, patterns: [...sharedCodePatterns, frameStorePattern] },
      ],
    },
  },
  {
    // The layers of the frame: pure files.
    files: ['src/shared/components/frame/**/*.@(utils|constants|types|schema).ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [...wrappedLibraryImports, ...framePurePaths],
          patterns: [...sharedCodePatterns, framePurePattern],
        },
      ],
    },
  },
  {
    // The wrappers in src/shared/components/ui import the libraries they wrap.
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: sharedCodePatterns }],
    },
  },
  {
    // A feature never depends on another feature or on the app layer. Files of the same
    // feature use relative imports.
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: wrappedLibraryImports, patterns: featurePatterns },
      ],
    },
  },
  ...featureFolderBlocks,
  ...featureComponentBlocks,
  {
    // File naming (CONTRIBUTING: TypeScript / React > Naming). Files whose names are set by
    // a tool (shadcn CLI, Next.js) or by convention (index.ts) are ignored.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: [
      'src/shared/components/ui/**',
      'src/shared/hooks/use-mobile.ts',
      'src/shared/lib/utils.ts',
      // Next.js file conventions: routing files, metadata files, and src-level entry points.
      'src/app/**/@(page|layout|loading|error|not-found|global-error|template|default).tsx',
      'src/app/**/@(icon|apple-icon|opengraph-image|twitter-image).tsx',
      'src/app/**/@(route|sitemap|robots|manifest).ts',
      'src/@(proxy|instrumentation|instrumentation-client).ts',
      'src/**/index.ts',
      'src/**/*.d.ts',
    ],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          // Components: PascalCase
          '**/!(__tests__)/!(*.config).tsx': '+([A-Z])*([a-zA-Z0-9])',
          // Configs that hold React elements, such as the item of a feature on the activity bar
          '**/!(__tests__)/*.config.tsx': '+([a-z0-9])*(-+([a-z0-9])).config',
          // Hooks: useSomething.ts
          '**/hooks/*.ts': 'use+([A-Z])*([a-zA-Z0-9])',
          // Everything else: <subject>.<kind>.ts, subject in kebab-case
          'src/**/!(hooks|__tests__)/*.ts':
            '+([a-z0-9])*(-+([a-z0-9])).@(api|keys|queries|types|schema|store|reducer|config|constants|utils|handlers|fixtures|setup|spec)',
          // Unit tests: only in a __tests__ folder, named after the file under test plus .test,
          // and the cases of a data-driven test after the file under test plus .data
          '**/__tests__/*.tsx': '+([A-Z])*([a-zA-Z0-9]).test',
          // Playwright: a spec, the cases of its tests beside it, and the helpers of a folder
          'tests/**/*.ts': '+([a-z0-9])*(-+([a-z0-9])).@(spec|data|utils)',
          '**/hooks/__tests__/*.ts': 'use+([A-Z])*([a-zA-Z0-9]).@(test|data)',
          '**/!(hooks)/__tests__/*.ts':
            '@(+([A-Z])*([a-zA-Z0-9]).data|+([a-z0-9])*(-+([a-z0-9])).@(api|keys|queries|types|schema|store|reducer|config|constants|utils|handlers|fixtures|setup).@(test|data))',
        },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          // Route folders: kebab-case segments plus (groups), [params], _private, @slots
          'src/app/**': 'NEXT_JS_APP_ROUTER_CASE',
          // Every other folder: kebab-case, or __tests__ for unit tests
          'src/!(app)/**': '@(__tests__|+([a-z0-9])*(-+([a-z0-9])))',
          'tests/**': 'KEBAB_CASE',
        },
      ],
    },
  },
  {
    // shadcn/ui code is copied from the registry. Keep it close to upstream so
    // `shadcn add --overwrite` diffs stay small; only relax stylistic type rules here.
    files: ['src/shared/components/ui/**/*.{ts,tsx}', 'src/shared/hooks/use-mobile.ts'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'jsx-a11y/anchor-has-content': 'off',
    },
  },
  {
    // Recharts payloads are typed as `any` upstream.
    files: ['src/shared/components/ui/chart.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['*.config.{ts,js,mjs}', 'tests/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
])
