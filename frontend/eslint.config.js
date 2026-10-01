import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextPlugin from '@next/eslint-plugin-next'
import checkFile from 'eslint-plugin-check-file'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    '.next',
    'next-env.d.ts',
    'coverage',
    'playwright-report',
    'test-results',
    'src/api/generated',
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
      // A feature is used through its index.ts only (CONTRIBUTING: Feature public API).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/**'],
              message:
                "Import from the feature's index (@/features/<feature>). Inside the same feature, use a relative import.",
            },
          ],
        },
      ],
    },
  },
  {
    // Shared code never depends on features or on the app layer (CONTRIBUTING: Import direction).
    files: ['src/@(components|hooks|lib|api)/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/**', '@/app/**', '@/providers/**'],
              message:
                'Shared code must not import features or the app layer. Pass feature components in as props from src/app/.',
            },
          ],
        },
      ],
    },
  },
  {
    // A feature never depends on another feature or on the app layer. Files of the same
    // feature use relative imports.
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/**', '@/app/**', '@/providers/**'],
              message:
                'A feature must not import another feature or the app layer. Compose features in src/app/, or move the shared code to src/components, src/hooks, or src/lib.',
            },
          ],
        },
      ],
    },
  },
  {
    // File naming (CONTRIBUTING: TypeScript / React > Naming). Files whose names are set by
    // a tool (shadcn CLI, Next.js) or by convention (index.ts) are ignored.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: [
      'src/components/ui/**',
      'src/hooks/use-mobile.ts',
      'src/lib/utils.ts',
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
          // Components: PascalCase, optionally .test
          '**/*.tsx': '+([A-Z])*([a-zA-Z0-9])?(.test)',
          // Hooks: useSomething.ts
          '**/hooks/*.ts': 'use+([A-Z])*([a-zA-Z0-9])?(.test)',
          // Everything else: <subject>.<kind>.ts, subject in kebab-case
          '**/!(hooks)/*.ts':
            '+([a-z0-9])*(-+([a-z0-9])).@(api|types|schema|store|reducer|config|constants|utils|handlers|fixtures|setup|spec)?(.test)',
        },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          // Route folders: kebab-case segments plus (groups), [params], _private, @slots
          'src/app/**': 'NEXT_JS_APP_ROUTER_CASE',
          // Every other folder: kebab-case
          'src/!(app)/**': 'KEBAB_CASE',
          'tests/**': 'KEBAB_CASE',
        },
      ],
    },
  },
  {
    // shadcn/ui code is copied from the registry. Keep it close to upstream so
    // `shadcn add --overwrite` diffs stay small; only relax stylistic type rules here.
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/hooks/use-mobile.ts'],
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
    files: ['src/components/ui/chart.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['*.config.{ts,js,mjs}', 'tests/e2e/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
])
