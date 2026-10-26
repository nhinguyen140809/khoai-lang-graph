import checkFile from 'eslint-plugin-check-file'
import { defineConfig } from 'eslint/config'

import {
  allFileKinds,
  kebabCasePattern,
  kindPlaces,
  pascalCasePattern,
} from '../lib/file-names/file-kinds.constants.js'
import { kindFileNamePattern, sliceFolderRules } from '../lib/file-names/file-names.utils.js'
import { nextRoutingFiles } from '../lib/next-routing-files.constants.js'

export default defineConfig([
  {
    // File naming. Files whose names are set by a tool (shadcn CLI, Next.js) or by convention
    // (index.ts) are ignored.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: [
      'src/shared/components/ui/**',
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
          '**/!(__tests__)/!(*.config).tsx': pascalCasePattern,
          // Configs that hold React elements, such as the item of a feature on the activity bar
          '**/!(__tests__)/*.config.tsx': `${kebabCasePattern}.config`,
          // Hooks: useSomething.ts
          '**/hooks/*.ts': `use${pascalCasePattern}`,
          // Everything else: <subject>.<kind>.ts, subject in kebab-case, with the kinds of its place
          ...Object.fromEntries(
            kindPlaces.map(({ files, kinds }) => [files, kindFileNamePattern(kinds)]),
          ),
          // Unit tests: only in a __tests__ folder, named after the file under test plus .test,
          // and the cases of a data-driven test after the file under test plus .data
          '**/__tests__/*.tsx': `${pascalCasePattern}.test`,
          // Playwright: a spec, the cases of its tests beside it, the helpers of a folder, and the
          // values that several specs share
          'tests/**/*.ts': `@(index|${kebabCasePattern}.@(spec|data|utils|constants))`,
          '**/hooks/__tests__/*.ts': `use${pascalCasePattern}.@(test|data)`,
          '**/!(hooks)/__tests__/*.ts': `@(${pascalCasePattern}.data|${kindFileNamePattern(allFileKinds)}.@(test|data))`,
        },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          // Route folders: kebab-case segments plus (groups), [params], _private, @slots
          'src/app/**': 'NEXT_JS_APP_ROUTER_CASE',
          // Every other folder: kebab-case, __tests__ for unit tests, or @x for the files that an
          // entity gives other entities
          'src/!(app)/**': `@(__tests__|@x|${kebabCasePattern})`,
          // A module holds its layers, and the root of a slice one folder for each kind it holds
          ...sliceFolderRules(),
          'tests/**': 'KEBAB_CASE',
        },
      ],
    },
  },
])
