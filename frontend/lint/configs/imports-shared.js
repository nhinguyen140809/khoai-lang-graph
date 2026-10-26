import { defineConfig } from 'eslint/config'

import {
  frameComponentPattern,
  frameHookPattern,
  framePurePaths,
  framePurePattern,
  frameStorePattern,
} from '../lib/imports/frame-patterns.constants.js'
import { restrictImports } from '../lib/imports/restrict-imports.utils.js'
import { sharedCodePatterns } from '../lib/imports/shared-patterns.constants.js'
import { wrappedLibraryImports } from '../lib/imports/wrapped-libraries.constants.js'

export default defineConfig([
  {
    // Shared code never depends on the layers above it.
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: restrictImports({ paths: wrappedLibraryImports, patterns: sharedCodePatterns }),
  },
  {
    // The layers of the frame: components.
    files: ['src/shared/components/frame/**/*.tsx'],
    ignores: ['**/__tests__/**'],
    rules: restrictImports({
      paths: wrappedLibraryImports,
      patterns: [...sharedCodePatterns, frameComponentPattern],
    }),
  },
  {
    // The layers of the frame: hooks.
    files: ['src/shared/components/frame/**/hooks/*.ts'],
    rules: restrictImports({
      paths: wrappedLibraryImports,
      patterns: [...sharedCodePatterns, frameHookPattern],
    }),
  },
  {
    // The layers of the frame: stores.
    files: ['src/shared/components/frame/**/*.store.ts'],
    rules: restrictImports({
      paths: wrappedLibraryImports,
      patterns: [...sharedCodePatterns, frameStorePattern],
    }),
  },
  {
    // The layers of the frame: pure files.
    files: ['src/shared/components/frame/**/*.@(utils|constants|types).ts'],
    rules: restrictImports({
      paths: [...wrappedLibraryImports, ...framePurePaths],
      patterns: [...sharedCodePatterns, framePurePattern],
    }),
  },
  {
    // The wrappers in src/shared/components/ui import the libraries they wrap.
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: restrictImports({ patterns: sharedCodePatterns }),
  },
])
