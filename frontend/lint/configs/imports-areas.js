import { defineConfig } from 'eslint/config'

import { publicApiPatterns } from '../lib/imports/public-api-patterns.constants.js'
import { restrictImports } from '../lib/imports/restrict-imports.utils.js'
import { developerAreaPatterns, userAreaPatterns } from '../lib/imports/area-patterns.constants.js'
import { wrappedLibraryImports } from '../lib/imports/wrapped-libraries.constants.js'

// The pages of each view import the slices of their own frame. A later block replaces the whole
// rule, so each block repeats the patterns of the public API that every file follows.
export default defineConfig([
  {
    files: ['src/app/user/**/*.{ts,tsx}'],
    rules: restrictImports({
      paths: wrappedLibraryImports,
      patterns: [...publicApiPatterns, ...userAreaPatterns],
    }),
  },
  {
    files: ['src/app/developer/**/*.{ts,tsx}'],
    rules: restrictImports({
      paths: wrappedLibraryImports,
      patterns: [...publicApiPatterns, ...developerAreaPatterns],
    }),
  },
])
