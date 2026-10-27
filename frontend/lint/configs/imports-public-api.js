import { defineConfig } from 'eslint/config'

import { publicApiPatterns } from '../lib/imports/public-api-patterns.constants.js'
import { restrictImports } from '../lib/imports/restrict-imports.utils.js'
import { wrappedLibraryImports } from '../lib/imports/wrapped-libraries.constants.js'

export default defineConfig([
  {
    // A slice is used through its index.ts only. The blocks of the shared code, the mocks and the
    // slices that come after this one repeat these patterns with their own.
    files: ['**/*.{ts,tsx}'],
    rules: restrictImports({ paths: wrappedLibraryImports, patterns: publicApiPatterns }),
  },
])
