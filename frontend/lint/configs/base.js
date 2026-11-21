import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import { defineConfig } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
// @ts-expect-error - the plugin ships no types
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { frontendRoot } from '../lib/paths.utils.js'

export default defineConfig([
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
        ? { project: process.env.ESLINT_TSCONFIG, tsconfigRootDir: frontendRoot }
        : { projectService: true, tsconfigRootDir: frontendRoot },
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
      // Clean code: flat control flow, read from the top down. A chain of conditions is a function
      // of early returns or a lookup, not a ternary inside a ternary.
      'no-nested-ternary': 'error',
      'max-depth': ['error', 3],
      'no-else-return': ['error', { allowElseIf: false }],
      complexity: ['error', 15],
      'max-params': ['error', 4],
      'no-lonely-if': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-return': 'error',
      'prefer-template': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-implicit-coercion': ['error', { boolean: false }],
      'object-shorthand': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Rows of data are built by position, one call to a line, which reads as a table; a builder
    // with many parameters is how a fixture stays short.
    files: ['**/fixtures/**/*.{ts,tsx}', '**/*.data.{ts,tsx}'],
    rules: { 'max-params': 'off' },
  },
  {
    // The components of shadcn are kept close to their source, so that an update of it stays easy
    // to read as a diff; they are long by design.
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: { complexity: 'off' },
  },
])
