import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextPlugin from '@next/eslint-plugin-next'
import checkFile from 'eslint-plugin-check-file'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import localRules from './lint/index.js'

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

// The rule of each module allows the modules of its list, so two lists that reach each other
// would let two modules import each other. Following the lists from any module never comes back
// to it, and every module that a list names has a list of its own.
const orderedModules = new Set()
function checkModuleOrder(name, trail) {
  if (trail.includes(name)) {
    const cycle = [...trail.slice(trail.indexOf(name)), name].join(' -> ')
    throw new Error(`MODULE_IMPORTS of eslint.config.js has a cycle: ${cycle}.`)
  }
  if (orderedModules.has(name)) return
  if (!(name in MODULE_IMPORTS)) {
    throw new Error(`${String(trail.at(-1))} lists ${name}, which MODULE_IMPORTS does not have.`)
  }
  for (const imported of MODULE_IMPORTS[name]) checkModuleOrder(imported, [...trail, name])
  orderedModules.add(name)
}
for (const name of Object.keys(MODULE_IMPORTS)) checkModuleOrder(name, [])

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

// The browser storage is used through the index of its folder.
const storageIndexPattern = {
  group: ['@/shared/lib/storage/**'],
  message: 'Import the storage from @/shared/lib/storage, its index.',
}

// The helpers of the unit tests are used through the index of their folder: @/test/msw,
// @/test/suites, @/test/next-stubs, @/test/render and @/test/steps.
const testHelpersIndexPattern = {
  group: ['@/test/*/**'],
  message: 'Import the test helpers from the index of their folder, such as @/test/msw.',
}

// The helpers of the mocks in src/mocks/shared are used through the index of their folder from
// outside src/mocks: @/mocks/shared/db, @/mocks/shared/scenario and @/mocks/shared/http/<topic>.
// Inside src/mocks a file imports the file it needs, since the layers of the mocks are checked
// by the kind of each file.
const mockHelpersIndexPattern = {
  group: ['@/mocks/shared/db/**', '@/mocks/shared/scenario/**', '@/mocks/shared/http/*/**'],
  message:
    'Import the helpers of the mocks from the index of their folder, such as @/mocks/shared/db.',
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
  storageIndexPattern,
  testHelpersIndexPattern,
  mockHelpersIndexPattern,
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
  storageIndexPattern,
  testHelpersIndexPattern,
  mockHelpersIndexPattern,
]

// The layers of the frame (README: Frame). A component reaches the state of the frame through
// hooks, a store may build on another store but never on a hook, and the pure files hold no React and
// no state.
const frameComponentPattern = {
  regex: '\\.store$',
  allowTypeImports: true,
  message:
    'A component of the frame reads and changes its state through the hooks of its folder, not a store.',
}

const frameStorePattern = {
  regex: '/hooks/',
  message: 'A store of the frame imports no hook: a hook runs only inside a component.',
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
    regex: '\\.api$|^@/shared/api/request/',
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
    name: '@/shared/api/request',
    importNames: ['apiRequest', 'apiCommand', 'fetchPage'],
    message: 'A component calls the API through a hook, which calls <subject>.api.ts.',
  },
  {
    name: '@tanstack/react-query',
    message: 'A component reads the queries and the mutations through a hook of its slice.',
  },
]

function restrict(paths, patterns) {
  return { 'no-restricted-imports': ['error', { paths, patterns }] }
}

// The end of a class whose value is in brackets, such as `text-[0.625rem]` or
// `[scrollbar-width:none]`, with an opacity or an important mark after it. A variant in brackets,
// such as `data-[state=open]:` or `group-data-[active=true]/tab:`, ends with a colon instead.
// esquery reads a regex up to the next slash, so the slash is written \x2F.
const bracketValue = String.raw`/\](?=$|\s|!|\x2F[\w.%-]*(?:\s|$))/`

// The props that take classes, and the calls of cn outside them, so that a class is reported once.
const classAttribute = 'JSXAttribute[name.name=/[cC]lassName$/]'

// Conventions that no plugin checks, as no-restricted-syntax selectors. A later block replaces the
// whole list of the rule, so each block spreads the groups it keeps.
const syntax = {
  persistStorage: [
    {
      selector:
        "CallExpression[callee.name='persist'] > ObjectExpression:not(:has(> Property[key.name='storage']))",
      message:
        'A persisted store passes storage: persistStorage(...) or persistStorageByEntry(...) of @/shared/lib/storage, which handles storage that is missing, blocked or full.',
    },
    {
      selector:
        "CallExpression[callee.name='persist'] > ObjectExpression > Property[key.name='name']:not([value.callee.name='storageKey'])",
      message: 'Name the key of a persisted store with storageKey(...) of @/shared/lib/storage.',
    },
  ],
  bracketClasses: [
    `${classAttribute} Literal[value=${bracketValue}]`,
    `${classAttribute} TemplateElement[value.raw=${bracketValue}]`,
    `CallExpression[callee.name='cn']:not(${classAttribute} *) Literal[value=${bracketValue}]`,
    `CallExpression[callee.name='cn']:not(${classAttribute} *) TemplateElement[value.raw=${bracketValue}]`,
  ].map((selector) => ({
    selector,
    message:
      'A class has no CSS value of its own in brackets outside src/shared/components/ui/. Use a token or a utility of the scale, or add one to src/app/styles.css (CONTRIBUTING: UI components).',
  })),
  innerHtml: [
    {
      selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
      message:
        'Never render content as HTML: put HTML artifacts in a sandboxed iframe (CONTRIBUTING: Untrusted content).',
    },
  ],
  inlineKeys: [
    {
      selector: "Property[key.name=/^(queryKey|mutationKey)$/][value.type='ArrayExpression']",
      message:
        'Take the key from the key factory of the resource, <resource>.keys.ts (CONTRIBUTING: Query keys).',
    },
  ],
  hooksInComponents: [
    'FunctionDeclaration[id.name=/^use[A-Z]/]',
    'VariableDeclarator[id.name=/^use[A-Z]/][init.type=/^(Arrow)?FunctionExpression$/]',
  ].map((selector) => ({
    selector,
    message:
      'A hook lives in hooks/use<Name>.ts of its slice, not in the file of a component (CONTRIBUTING: Hooks of a slice).',
  })),
  // An action that deletes, stops or revokes something asks first, in a dialog (ConfirmDialog).
  destructiveActions: [
    {
      selector:
        'ImportSpecifier[imported.name=/^use(Delete|Remove|Stop|Revoke|Discard|Reset)[A-Z][A-Za-z]*(?<!Dialog)$/]',
      message:
        'A destructive action asks first: call this hook from a *Dialog.tsx file that renders ConfirmDialog, and open that dialog from menus, rows and commands (CONTRIBUTING: Destructive actions).',
    },
  ],
  // The address of a page that comes from data is typed with routeOfAddress, in one place.
  routeCast: ["TSAsExpression[typeAnnotation.typeName.name='Route']"].map((selector) => ({
    selector,
    message:
      'Do not cast to Route: write the address of a page with routes or checkedRoute, and an address that comes from data with routeOfAddress of @/shared/routes.',
  })),
  // A method written as a literal is checked by its type where it is given to a function or a field
  // of the type HttpMethod, so the tests may write it; the code outside the tests uses the name.
  httpMethodLiteral: [
    {
      selector: "Property[key.name='method'] > Literal[value=/^(GET|POST|PUT|PATCH|DELETE)$/]",
      message: 'Use HttpMethod of @/shared/api/http.',
    },
  ],
  // A unit test types, pastes and presses keys with the steps of @/test/steps.
  userEventKeys: [
    {
      selector:
        'CallExpression[callee.object.name=/^(user|userEvent)$/][callee.property.name=/^(keyboard|type|paste|tab)$/]',
      message:
        'Use typeText, pasteText, pressKey, pressKeys, pressTab or clickHolding of @/test/steps.',
    },
  ],
  // A unit test gets its query cache from @/test/render.
  testQueryClient: [
    {
      selector: "NewExpression[callee.name='QueryClient']",
      message:
        'Use createTestQueryClient of @/test/render, or the cache that renderWithProviders makes.',
    },
  ],
  // The methods, statuses and headers of HTTP have names in @/shared/api/http, which is the only
  // place that writes them out.
  httpVocabulary: [
    {
      selector: "Property[key.name='status'] > Literal[raw=/^[1-5]\\d\\d$/]",
      message: 'Use HttpStatus of @/shared/api/http.',
    },
    {
      selector:
        'Literal[value=/^(Content-Type|Content-Disposition|Location|If-Match|Idempotency-Key)$/]',
      message: 'Use HttpHeader of @/shared/api/http.',
    },
    {
      selector: 'Literal[value=/^(application\\/json|application\\/problem\\+json|text\\/plain)$/]',
      message: 'Use MediaType of @/shared/api/http.',
    },
  ],
  // The paths of the API are written once, in @/shared/api/endpoints.
  apiPaths: ['Literal', 'TemplateElement'].map((type) => ({
    selector:
      type === 'Literal'
        ? 'Literal[value=/^\\/api\\/v1\\//]'
        : 'TemplateElement[value.raw=/^\\/api\\/v1\\//]',
    message:
      'Write the path of the API with apiEndpoints of @/shared/api/endpoints, or apiEndpoint for a path of its own.',
  })),
  defaultExport: ['ExportDefaultDeclaration', "ExportSpecifier[exported.name='default']"].map(
    (selector) => ({
      selector,
      message: 'Use a named export; only the routing files of Next.js export a default.',
    }),
  ),
  // A file of functions keeps the types that others use in the types file of its subject; a type
  // that only it uses stays in the file, unexported.
  exportedTypes: [
    "ExportNamedDeclaration[exportKind='type']",
    "ExportSpecifier[exportKind='type']",
  ].map((selector) => ({
    selector,
    message:
      'A file of functions exports no type: a type that others use goes in the types file of its subject, and one only this file uses stays here, unexported (CONTRIBUTING: Types and constants).',
  })),
  // A constants file holds only the words of the screens and the settings.
  valuesInConstants: [
    ...['TSInterfaceDeclaration', 'TSTypeAliasDeclaration'].map((type) => ({
      selector: `ExportNamedDeclaration > ${type}`,
      message:
        'A constants file exports no type: a type that others use goes in the types file of its subject (CONTRIBUTING: Types and constants).',
    })),
    ...[
      ':matches(Program, ExportNamedDeclaration) > FunctionDeclaration',
      ':matches(Program, ExportNamedDeclaration) > VariableDeclaration > VariableDeclarator[init.type=/^(Arrow)?FunctionExpression$/]',
    ].map((selector) => ({
      selector,
      message:
        'A constants file holds no function: a function goes in the utils file of its topic (CONTRIBUTING: Types and constants).',
    })),
  ],
  // A types file holds a list of values with the type made from it, so it never reads a constants
  // file, and the two never import each other.
  constantsInTypes: [
    'ImportDeclaration[source.value=/\\.constants$/]',
    'ExportNamedDeclaration[source.value=/\\.constants$/]',
    'ExportAllDeclaration[source.value=/\\.constants$/]',
  ].map((selector) => ({
    selector,
    message:
      'A types file imports no constants file: a list of values and the type made from it go in the types file (CONTRIBUTING: Types and constants).',
  })),
}

// Names that say nothing of what they hold, abbreviations, and handle... (an event handler is
// named after what it does).
const vagueName =
  '^(data|info|tmp|temp|obj|arr|val|res|resp|req|cb|fn|ctx|msg|btn|el|elem)$|^handle[A-Z]'

function restrictSyntax(...groups) {
  return { 'no-restricted-syntax': ['error', ...groups.flatMap((group) => syntax[group])] }
}

// The kinds of file of src/mocks that a file may not import, by the kinds that it is.
const mockLayers = [
  {
    kinds: ['fixtures', 'constants', 'types'],
    above: ['store', 'lookup', 'changes', 'problems', 'validators', 'handlers'],
  },
  { kinds: ['store'], above: ['lookup', 'changes', 'problems', 'validators', 'handlers'] },
  { kinds: ['lookup'], above: ['changes', 'problems', 'validators', 'handlers'] },
  { kinds: ['changes'], above: ['problems', 'validators', 'handlers'] },
  { kinds: ['problems'], above: ['changes', 'validators', 'handlers'] },
  { kinds: ['validators'], above: ['changes', 'problems', 'handlers'] },
  { kinds: ['utils', 'handlers'], above: ['handlers'] },
]

// The files of src/app/ whose default export Next.js reads.
const nextRoutingFiles = [
  'src/app/**/@(page|layout|loading|error|not-found|global-error|template|default).tsx',
  'src/app/**/@(icon|apple-icon|opengraph-image|twitter-image).tsx',
  'src/app/**/@(route|sitemap|robots|manifest).ts',
]

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
  shared: ['types', 'store', 'reducer', 'config', 'constants', 'utils'],
  mocks: [
    'types',
    'store',
    'constants',
    'utils',
    'handlers',
    'fixtures',
    'lookup',
    'changes',
    'problems',
    'validators',
    'setup',
  ],
  test: ['utils', 'types', 'setup'],
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
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // A module is imported in one statement, apart from its types (consistent-type-imports).
      'import/no-duplicates': 'error',
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
    // Browser storage is read and written through src/shared/lib/storage/browser-storage.utils.ts
    // only, which handles storage that is missing, blocked or full.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: ['src/shared/lib/storage/browser-storage.utils.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['localStorage', 'sessionStorage'].map((name) => ({
          name,
          message: 'Use browserStorage of @/shared/lib/storage, or persistStorage for a store.',
        })),
      ],
      'no-restricted-properties': [
        'error',
        ...['window', 'globalThis', 'self'].flatMap((object) =>
          ['localStorage', 'sessionStorage'].map((property) => ({
            object,
            property,
            message: 'Use browserStorage of @/shared/lib/storage, or persistStorage for a store.',
          })),
        ),
      ],
    },
  },
  {
    // The names that say what a thing is (CONTRIBUTING: Names). A boolean, or a function that
    // returns one, is is..., has... or can...; find... may come back empty and get... never does;
    // a name does not use a word that the app dropped.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: ['src/shared/components/ui/**'],
    plugins: { local: localRules },
    rules: {
      'local/boolean-name': 'error',
      'local/find-get-name': 'error',
      'local/retired-words': [
        'error',
        {
          retired: [
            { words: ['sign', 'in'], use: 'log in (login)' },
            { words: ['sign', 'out'], use: 'log out (logout)' },
            { words: ['sign', 'up'], use: 'register' },
            { words: ['create', 'account'], use: 'register' },
          ],
        },
      ],
    },
  },
  {
    // find... in the helpers of the tests waits for the element and throws, as findBy... does.
    files: ['src/test/**/*.ts', 'src/**/__tests__/**/*.{ts,tsx}'],
    rules: { 'local/find-get-name': 'off' },
  },
  {
    // An exported value is camelCase, or PascalCase for a component, a context or an object used
    // as an enum; UPPER_SNAKE_CASE is for a setting private to its file (CONTRIBUTING: Identifier
    // naming). A variable or a parameter is not named with a word that fits anything (data, info,
    // res), an abbreviation (req, msg, btn), or handle... for an event handler; a type is not
    // named Props alone; destructuring keeps the names of the fields it takes.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: ['src/shared/components/ui/**'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['exported'],
          format: ['camelCase', 'PascalCase'],
          custom: { regex: vagueName, match: false },
        },
        {
          selector: ['variable', 'parameter'],
          format: null,
          custom: { regex: vagueName, match: false },
        },
        { selector: ['variable', 'parameter'], modifiers: ['destructured'], format: null },
        { selector: 'function', format: null, custom: { regex: vagueName, match: false } },
        {
          selector: ['interface', 'typeAlias', 'class', 'enum'],
          format: null,
          custom: { regex: '^Props$', match: false },
        },
      ],
    },
  },
  {
    // The components copied from shadcn/ui keep their names.
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variable', modifiers: ['exported'], format: ['camelCase', 'PascalCase'] },
      ],
    },
  },
  // The groups of `syntax` that each place of src/ follows. The UI components, copied from
  // shadcn/ui, keep their classes in brackets and their hooks beside their components; a test
  // writes its keys and declares its hooks where it uses them.
  {
    files: ['src/**/*.ts'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'defaultExport',
      'routeCast',
      'httpVocabulary',
      'httpMethodLiteral',
      'apiPaths',
    ),
  },
  {
    files: ['src/**/*.@(utils|lookup|changes|problems|validators|handlers).ts'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'defaultExport',
      'exportedTypes',
      'routeCast',
      'httpVocabulary',
      'httpMethodLiteral',
      'apiPaths',
    ),
  },
  {
    files: ['src/**/*.constants.ts'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'defaultExport',
      'valuesInConstants',
      'routeCast',
      'httpVocabulary',
      'httpMethodLiteral',
      'apiPaths',
    ),
  },
  {
    files: ['src/**/*.types.ts'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'defaultExport',
      'constantsInTypes',
      'routeCast',
      'httpVocabulary',
      'httpMethodLiteral',
      'apiPaths',
    ),
  },
  {
    files: ['src/**/*.tsx'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'hooksInComponents',
      'defaultExport',
      'routeCast',
      'httpVocabulary',
      'httpMethodLiteral',
      'apiPaths',
      'destructiveActions',
    ),
  },
  {
    // The dialogs that ask before a destructive action are the components that call it.
    files: ['src/**/*Dialog.tsx'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'hooksInComponents',
      'defaultExport',
      'routeCast',
      'httpVocabulary',
      'httpMethodLiteral',
      'apiPaths',
    ),
  },
  {
    files: ['src/**/__tests__/**/*.{ts,tsx}'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'defaultExport',
      'httpVocabulary',
      'apiPaths',
      'userEventKeys',
      'testQueryClient',
    ),
  },
  {
    // The test of the endpoints writes the paths that they must give.
    files: ['src/shared/api/endpoints/__tests__/**/*.ts'],
    rules: restrictSyntax('persistStorage', 'bracketClasses', 'innerHtml', 'defaultExport'),
  },
  {
    // The names of HTTP are written out here.
    files: ['src/shared/api/http/**/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: restrictSyntax('persistStorage', 'innerHtml', 'inlineKeys', 'defaultExport'),
  },
  {
    // The charts of shadcn/ui write the CSS variables of their colors into a style element.
    files: ['src/shared/components/ui/chart.tsx'],
    rules: restrictSyntax('persistStorage', 'inlineKeys', 'defaultExport'),
  },
  {
    files: nextRoutingFiles,
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'hooksInComponents',
      'routeCast',
      'httpVocabulary',
      'httpMethodLiteral',
      'apiPaths',
    ),
  },
  {
    // The one place that casts an address to Route.
    files: ['src/shared/routes/typed-route/typed-route.utils.ts'],
    rules: restrictSyntax(
      'persistStorage',
      'bracketClasses',
      'innerHtml',
      'inlineKeys',
      'defaultExport',
      'exportedTypes',
    ),
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
    files: ['src/shared/components/frame/**/*.@(utils|constants|types).ts'],
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
  // Inside src/mocks a file reads only files of its own kind or of a kind below it: the data
  // (fixtures, constants, types), then the store, then lookup, then changes and problems, then
  // handlers, which only the setup files and the tests import (frontend README: Files of a mock
  // folder).
  ...mockLayers.map(({ kinds, above }) => ({
    files: [`src/mocks/**/*.@(${kinds.join('|')}).ts`],
    rules: restrict(wrappedLibraryImports, [
      ...publicApiPatterns,
      {
        regex: `\\.(${above.join('|')})$`,
        message: `A ${kinds.join(', ')} file of the mocks does not read a ${above.join(', ')} file: they sit above it (frontend README: Files of a mock folder).`,
      },
    ]),
  })),
  // A slice imports only the layers under it and the modules under its module, other slices from
  // their index, and its own files with relative imports (CONTRIBUTING: Modules).
  ...sliceBlocks,
  {
    // File naming (CONTRIBUTING: TypeScript / React > Naming). Files whose names are set by
    // a tool (shadcn CLI, Next.js) or by convention (index.ts) are ignored.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: [
      'src/shared/components/ui/**',
      'src/shared/lib/viewport/hooks/use-mobile.ts',
      // Next.js file conventions: routing files, metadata files, and src-level entry points.
      ...nextRoutingFiles,
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
          // Playwright: a spec, the cases of its tests beside it, the helpers of a folder, and the
          // values that several specs share
          'tests/**/*.ts': '@(index|+([a-z0-9])*(-+([a-z0-9])).@(spec|data|utils|constants))',
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
    files: [
      'src/shared/components/ui/**/*.{ts,tsx}',
      'src/shared/lib/viewport/hooks/use-mobile.ts',
    ],
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
    // The steps that E2E tests and screenshot specs share are used through the index of their folder.
    files: ['tests/e2e/**/*.ts', 'tests/screenshots/**/*.ts', 'tests/shared/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/shared/steps/*'],
              message: 'Import the steps from the index of their folder, tests/shared/steps.',
            },
          ],
        },
      ],
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
