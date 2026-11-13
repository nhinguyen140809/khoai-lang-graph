import { defineConfig } from 'eslint/config'

import { restrictImports } from '../lib/imports/restrict-imports.utils.js'

export default defineConfig([
  {
    // The steps that E2E tests and screenshot specs share are used through the index of their folder.
    files: ['tests/e2e/**/*.ts', 'tests/screenshots/**/*.ts', 'tests/shared/*.ts'],
    rules: restrictImports({
      patterns: [
        {
          group: ['**/shared/steps/*'],
          message: 'Import the steps from the index of their folder, tests/shared/steps.',
        },
        {
          group: ['**/shared/api/*'],
          message: 'Import the API helpers from the index of their folder, tests/shared/api.',
        },
      ],
    }),
  },
])
