import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import checkFile from 'eslint-plugin-check-file'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'src/api/generated',
    'src/routeTree.gen.ts',
    'public/mockServiceWorker.js',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
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
    },
  },
  {
    // File naming (CONTRIBUTING: TypeScript / React > Naming). Files whose names are set by
    // a tool (shadcn CLI, TanStack Router, Vite) or by convention (index.ts) are ignored.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: [
      'src/components/ui/**',
      'src/hooks/use-mobile.ts',
      'src/lib/utils.ts',
      'src/routes/**',
      'src/main.tsx',
      'src/**/index.ts',
      'src/routeTree.gen.ts',
      'src/vite-env.d.ts',
    ],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          // Components: PascalCase, optionally .test
          '**/*.tsx': '+([A-Z])*([a-zA-Z0-9])?(.test)',
          // Hooks: useSomething.ts
          '**/hooks/*.ts': 'use+([A-Z])*([a-zA-Z0-9])?(.test)',
          // Everything else: <subject>.<kind>.ts, subject in kebab-case
          '**/!(hooks)/*.ts':
            '+([a-z0-9])*(-+([a-z0-9])).@(api|types|schema|store|reducer|config|constants|utils|handlers|setup|spec)?(.test)',
        },
      ],
    },
  },
  {
    // shadcn/ui code is copied from the registry. Keep it close to upstream so
    // `shadcn add --overwrite` diffs stay small; only relax stylistic type rules here.
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/hooks/use-mobile.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    // Recharts payloads are typed as `any` upstream.
    files: ['src/components/ui/chart.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    // TanStack Router route files export `Route`, not components.
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['*.config.{ts,js}', 'tests/e2e/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
])
