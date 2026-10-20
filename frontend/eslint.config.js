import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

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

// The modules of src/modules/ and the modules that each one may import (CONTRIBUTING: Modules).
// A module imports only the modules under it, so that the modules depend one way; a module that
// does not exist yet has its place already.
const MODULE_IMPORTS = {
  workflow: [],
  artifact: [],
  run: ['workflow', 'artifact'],
  review: ['workflow', 'artifact', 'run'],
  thread: ['workflow', 'artifact', 'run', 'review'],
  project: ['workflow', 'artifact', 'run', 'review', 'thread'],
  activity: ['workflow', 'artifact', 'run', 'review', 'thread'],
  auth: [],
  user: ['auth'],
  usage: [],
  'design-system': [],
}

function foldersOf(folder) {
  const root = path.join(import.meta.dirname, folder)
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

const modules = foldersOf('src/modules')
for (const name of modules) {
  if (!(name in MODULE_IMPORTS)) {
    throw new Error(`Give the module ${name} its place in MODULE_IMPORTS of eslint.config.js.`)
  }
}

// The layers of a module, from the lowest: one slice of entities, then one slice for each feature
// and for each widget.
const MODULE_LAYERS = ['entities', 'features', 'widgets']

const outsideLayers = ['app', 'providers']
const message = {
  upward: 'A layer imports only the layers under it (CONTRIBUTING: Modules).',
  publicApi:
    'Import a slice from its index (@/modules/<module>/entities, @/modules/<module>/features/<feature>, @/modules/<module>/widgets/<widget>). Inside the same slice, use a relative import.',
  order: 'A module imports only the modules under it (MODULE_IMPORTS in eslint.config.js).',
}

// A slice is used through its index.ts only, from any layer above it; inside a slice, files use
// relative imports. The files of the @x folder of an entity are for the entities of other modules.
const publicApiPatterns = [
  { regex: '^@/modules/[^/]+/entities/', message: message.publicApi },
  { regex: '^@/modules/[^/]+/(features|widgets)/[^/]+/', message: message.publicApi },
  {
    regex: '^(\\.\\./)+(src/)?modules/',
    message: 'Import a slice with @/, from its index.',
  },
  {
    group: ['@/shared/components/frame/**'],
    message: 'Import the frame from @/shared/components/frame, its index.',
  },
]

const outsidePatterns = [
  {
    group: outsideLayers.flatMap((name) => [`@/${name}`, `@/${name}/**`]),
    message: message.upward,
  },
  { regex: `^(\\.\\./)+(src/)?(${outsideLayers.join('|')})(/|$)`, message: message.upward },
]

// The patterns of a file of a module: the layers above its own, the other slices of its layer,
// the modules above its module, and the inside of every slice. A unit test may import another slice
// of its layer, from its index, to show slices together.
function modulePatterns(module, layer, isTest) {
  const above = MODULE_LAYERS.slice(MODULE_LAYERS.indexOf(layer) + 1)
  const patterns = [...outsidePatterns]
  if (above.length > 0) {
    patterns.push({ regex: `^@/modules/[^/]+/(${above.join('|')})(/|$)`, message: message.upward })
  }
  patterns.push({
    regex: `^@/modules/(?!(${[module, ...MODULE_IMPORTS[module]].join('|')})/)`,
    message: message.order,
  })
  if (layer === 'entities') {
    patterns.push({
      regex: isTest
        ? `^@/modules/[^/]+/entities/(?!@x/${module}$)`
        : `^@/modules/[^/]+/entities(?!/@x/${module}$)(/|$)`,
      message: `An entity imports another entity only through the file that the other gives it: @/modules/<module>/entities/@x/${module}.`,
    })
    patterns.push(...publicApiPatterns.slice(1))
  } else {
    if (!isTest) {
      patterns.push({
        regex: `^@/modules/[^/]+/${layer}(/|$)`,
        message:
          layer === 'features'
            ? 'A feature never imports another feature. Compose features in a widget or in src/app/, or move the code they share down a layer.'
            : 'A widget never imports another widget. Compose widgets in src/app/.',
      })
    }
    patterns.push(...publicApiPatterns)
  }
  return patterns
}

const sharedCodePatterns = [
  {
    group: ['@/modules', '@/modules/**', ...outsidePatterns[0].group],
    message:
      'Shared code imports no module or app code. Pass their components in as props from src/app/.',
  },
  {
    regex: '^(\\.\\./)+(modules|app|providers)(/|$)',
    message:
      'Shared code imports no module or app code. Pass their components in as props from src/app/.',
  },
  {
    group: ['@/shared/components/frame', '@/shared/components/frame/**'],
    message:
      'Shared code does not import the frame. Inside src/shared/components/frame, use relative imports.',
  },
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

// The deepest folder of a slice that gets its own rule below, counted from the slice folder.
const SLICE_FOLDER_DEPTH = 5

// A relative import that climbs out of its slice folder reaches another slice, the app layer or
// shared code. How many `../` that takes depends on how deep the file is, so each depth of folder
// gets its own block.
function climbPattern(depth) {
  return {
    regex: `^(\\.\\./){${String(depth + 1)},}`,
    message:
      'A relative import stays inside its slice. Import another slice from its index, and shared code with @/shared.',
  }
}

// A component of a slice reaches the API, the cache of the queries and the stores through the
// hooks of its slice, which hold what follows a call.
const componentPatterns = [
  {
    regex: '\\.api$|/shared/api/api-fetch\\.utils$',
    message: 'A component calls the API through a hook, which calls <subject>.api.ts.',
  },
  {
    regex: '\\.store$',
    message: 'A component reads and changes a store through a hook of its slice.',
  },
]

const componentPaths = [
  ...wrappedLibraryImports,
  {
    name: '@tanstack/react-query',
    message: 'A component reads the queries and the mutations through a hook of its slice.',
  },
]

function restrict(paths, patterns) {
  return { 'no-restricted-imports': ['error', { paths, patterns }] }
}

// The slices that share their rules: the entities of a module, its features and its widgets.
const sliceSets = [
  ...modules.flatMap((module) =>
    MODULE_LAYERS.map((layer) => ({
      root:
        layer === 'entities'
          ? `src/modules/${module}/entities`
          : `src/modules/${module}/${layer}/*`,
      patterns: (isTest) => modulePatterns(module, layer, isTest),
    })),
  ),
]

// The blocks of the slices: their files at each depth, then the components, then the tests. A later
// block replaces the whole rule, so each one repeats the patterns it keeps.
const depths = Array.from({ length: SLICE_FOLDER_DEPTH + 1 }, (_, depth) => depth)
const sliceBlocks = sliceSets.flatMap(({ root, patterns }) => [
  ...depths.map((depth) => ({
    files: [`${root}/${'*/'.repeat(depth)}*.{ts,tsx}`],
    rules: restrict(wrappedLibraryImports, [...patterns(false), climbPattern(depth)]),
  })),
  ...depths.slice(1).map((depth) => ({
    files: [`${root}/components/${'*/'.repeat(depth - 1)}*.{ts,tsx}`],
    ignores: ['**/__tests__/**'],
    rules: restrict(componentPaths, [
      ...patterns(false),
      climbPattern(depth),
      ...componentPatterns,
    ]),
  })),
  ...depths.slice(1).map((depth) => ({
    files: [`${root}/${'*/'.repeat(depth - 1)}__tests__/*.{ts,tsx}`],
    rules: restrict(wrappedLibraryImports, [...patterns(true), climbPattern(depth)]),
  })),
])

// The kinds of file, <subject>.<kind>.ts, that each place of src/ holds (Web App Modules: Kinds of
// file in a slice). Components (.tsx), hooks (hooks/useSomething.ts) and unit tests have rules of
// their own; a kind with two files or more gets a folder named after it in the plural.
const FILE_KINDS = {
  entities: ['api', 'keys', 'queries', 'types', 'reducer', 'constants', 'utils'],
  features: ['types', 'schema', 'store', 'reducer', 'constants', 'utils'],
  widgets: ['types', 'store', 'reducer', 'constants', 'utils', 'fixtures'],
  shared: ['types', 'schema', 'store', 'reducer', 'config', 'constants', 'utils'],
  mocks: ['types', 'store', 'constants', 'utils', 'handlers', 'fixtures', 'setup'],
  test: ['utils', 'setup'],
}
const ALL_FILE_KINDS = [...new Set(Object.values(FILE_KINDS).flat())]
const KIND_FOLDERS = {
  api: 'api',
  keys: 'keys',
  queries: 'queries',
  types: 'types',
  schema: 'schemas',
  store: 'stores',
  reducer: 'reducers',
  constants: 'constants',
  utils: 'utils',
  fixtures: 'fixtures',
}

function kindFileName(kinds) {
  return `+([a-z0-9])*(-+([a-z0-9])).@(${kinds.join('|')})`
}

// The folders at the root of a slice: one for each kind it holds, components/, hooks/ and the
// unit tests, and in the entities the @x folder.
function sliceFolderNames(layer) {
  const own = FILE_KINDS[layer].map((kind) => KIND_FOLDERS[kind])
  const extra = layer === 'entities' ? ['@x'] : []
  return `@(${[...own, 'components', 'hooks', '__tests__', ...extra].join('|')})`
}

// The names of the folders of the modules. The plugin checks every folder that a wildcard of a
// glob matches, so each rule names its module and its slice and leaves one wildcard, the last.
const sliceFolderRules = Object.fromEntries(
  modules.flatMap((module) => [
    [`src/modules/${module}/*/`, `@(${MODULE_LAYERS.join('|')})`],
    [`src/modules/${module}/entities/*/`, sliceFolderNames('entities')],
    ...['features', 'widgets'].flatMap((layer) =>
      foldersOf(`src/modules/${module}/${layer}`).map((slice) => [
        `src/modules/${module}/${layer}/${slice}/*/`,
        sliceFolderNames(layer),
      ]),
    ),
  ]),
)

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
      // A slice is used through its index.ts only (CONTRIBUTING: Modules).
      'no-restricted-imports': [
        'error',
        { paths: wrappedLibraryImports, patterns: publicApiPatterns },
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
    // Shared code never depends on the layers above it (CONTRIBUTING: Modules).
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: wrappedLibraryImports, patterns: sharedCodePatterns },
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
  // A slice imports only the layers under it and the modules under its module, other slices from
  // their index, and its own files with relative imports (CONTRIBUTING: Modules).
  ...sliceBlocks,
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
      // The files that an entity gives another entity are named after that entity.
      'src/modules/*/entities/@x/*.ts',
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
          // Everything else: <subject>.<kind>.ts, subject in kebab-case, with the kinds of its place
          'src/**/!(hooks|__tests__)/*.ts': kindFileName(ALL_FILE_KINDS),
          'src/modules/*/entities/**/!(hooks|__tests__|@x)/*.ts': kindFileName(FILE_KINDS.entities),
          'src/modules/*/entities/*.ts': kindFileName(FILE_KINDS.entities),
          'src/modules/*/features/**/!(hooks|__tests__)/*.ts': kindFileName(FILE_KINDS.features),
          'src/modules/*/widgets/**/!(hooks|__tests__)/*.ts': kindFileName(FILE_KINDS.widgets),
          'src/shared/**/!(hooks|__tests__)/*.ts': kindFileName(FILE_KINDS.shared),
          'src/mocks/**/!(hooks|__tests__)/*.ts': kindFileName(FILE_KINDS.mocks),
          'src/test/**/!(hooks|__tests__)/*.ts': kindFileName(FILE_KINDS.test),
          // Unit tests: only in a __tests__ folder, named after the file under test plus .test,
          // and the cases of a data-driven test after the file under test plus .data
          '**/__tests__/*.tsx': '+([A-Z])*([a-zA-Z0-9]).test',
          // Playwright: a spec, the cases of its tests beside it, and the helpers of a folder
          'tests/**/*.ts': '+([a-z0-9])*(-+([a-z0-9])).@(spec|data|utils)',
          '**/hooks/__tests__/*.ts': 'use+([A-Z])*([a-zA-Z0-9]).@(test|data)',
          '**/!(hooks)/__tests__/*.ts': `@(+([A-Z])*([a-zA-Z0-9]).data|${kindFileName(ALL_FILE_KINDS)}.@(test|data))`,
        },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          // Route folders: kebab-case segments plus (groups), [params], _private, @slots
          'src/app/**': 'NEXT_JS_APP_ROUTER_CASE',
          // Every other folder: kebab-case, __tests__ for unit tests, or @x for the files that an
          // entity gives other entities
          'src/!(app)/**': '@(__tests__|@x|+([a-z0-9])*(-+([a-z0-9])))',
          // A module holds its layers, and the root of a slice one folder for each kind it holds
          ...sliceFolderRules,
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
