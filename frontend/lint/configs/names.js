import { defineConfig } from 'eslint/config'

import { retiredWords } from '../lib/names/retired-words.constants.js'
import { vagueNamePattern } from '../lib/names/vague-names.constants.js'
import localRules from '../plugin/index.js'

export default defineConfig([
  {
    // The names that say what a thing is. A boolean, or a function that returns one, is is...,
    // has... or can...; find... may come back empty and get... never does; a name does not use a
    // word that the app dropped.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: ['src/shared/components/ui/**'],
    plugins: { local: /** @type {import('eslint').ESLint.Plugin} */ (localRules) },
    rules: {
      'local/boolean-name': 'error',
      'local/find-get-name': 'error',
      'local/retired-words': ['error', { retired: retiredWords }],
    },
  },
  {
    // The route configs that Next.js reads from a page or a layout keep its names, such as `instant`.
    files: ['src/app/**/{page,layout}.tsx'],
    rules: { 'local/boolean-name': 'off' },
  },
  {
    // find... in the helpers of the tests waits for the element and throws, as findBy... does.
    files: ['src/test/**/*.ts', 'src/**/__tests__/**/*.{ts,tsx}'],
    rules: { 'local/find-get-name': 'off' },
  },
  {
    // An exported value is camelCase, or PascalCase for a component, a context or an object used
    // as an enum; UPPER_SNAKE_CASE is for a setting private to its file. A variable or a
    // parameter is not named with a word that fits anything (data, info, res), an abbreviation
    // (req, msg, btn), or handle... for an event handler; a type is not named Props alone;
    // destructuring keeps the names of the fields it takes.
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    ignores: ['src/shared/components/ui/**'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['exported'],
          format: ['camelCase', 'PascalCase'],
          custom: { regex: vagueNamePattern, match: false },
        },
        {
          selector: ['variable', 'parameter'],
          format: null,
          custom: { regex: vagueNamePattern, match: false },
        },
        { selector: ['variable', 'parameter'], modifiers: ['destructured'], format: null },
        { selector: 'function', format: null, custom: { regex: vagueNamePattern, match: false } },
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
])
