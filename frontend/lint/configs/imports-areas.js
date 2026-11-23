import { defineConfig } from 'eslint/config'

import { publicApiPatterns } from '../lib/imports/public-api-patterns.constants.js'
import { restrictImports } from '../lib/imports/restrict-imports.utils.js'
import { wrappedLibraryImports } from '../lib/imports/wrapped-libraries.constants.js'

// The pages of each view place the frame and the slices of their own view. What belongs to a view
// says so where it is declared (`@view user`, `@view developer` in its doc comment), and the rule
// view-boundary reads the tag, so a new component needs no entry here. A later block replaces the
// whole rule, so each block repeats the patterns of the public API that every file follows.
export default defineConfig([
  {
    files: ['src/app/user/**/*.{ts,tsx}', 'src/app/developer/**/*.{ts,tsx}'],
    rules: {
      ...restrictImports({ paths: wrappedLibraryImports, patterns: publicApiPatterns }),
      'local/view-boundary': 'error',
    },
  },
])
