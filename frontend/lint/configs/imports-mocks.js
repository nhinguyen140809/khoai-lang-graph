import { defineConfig } from 'eslint/config'

import { publicApiPatterns } from '../lib/imports/public-api-patterns.constants.js'
import { restrictImports } from '../lib/imports/restrict-imports.utils.js'
import { wrappedLibraryImports } from '../lib/imports/wrapped-libraries.constants.js'

/**
 * The kinds of file of src/mocks below the handlers, from the lowest tier to the highest. A file
 * reads its own kind or a kind of a tier below it; the kinds of an `isolated` tier do not read
 * each other either, since each is a step of its own.
 * @type {{ kinds: string[], isolated: boolean }[]}
 */
const mockTiers = [
  { kinds: ['fixtures', 'constants', 'types'], isolated: false },
  { kinds: ['store'], isolated: false },
  { kinds: ['lookup'], isolated: false },
  { kinds: ['changes', 'problems', 'validators'], isolated: true },
]
const handlerKinds = ['handlers']

/** @param {number} tierIndex */
function kindsOnTop(tierIndex) {
  return [...mockTiers.slice(tierIndex + 1).flatMap((tier) => tier.kinds), ...handlerKinds]
}

// For each kind of file of src/mocks, the kinds above it, which a file of that kind may not import.
// The helpers of `utils` and the handlers read any kind, but a handler reads no other handler.
const mockLayers = [
  ...mockTiers.flatMap(({ kinds, isolated }, tierIndex) =>
    isolated
      ? kinds.map((kind) => ({
          kinds: [kind],
          kindsAbove: [...kinds.filter((other) => other !== kind), ...kindsOnTop(tierIndex)],
        }))
      : [{ kinds, kindsAbove: kindsOnTop(tierIndex) }],
  ),
  { kinds: ['utils', ...handlerKinds], kindsAbove: handlerKinds },
]

export default defineConfig([
  // Inside src/mocks a file reads only files of its own kind or of a kind below it: the data
  // (fixtures, constants, types), then the store, then lookup, then changes and problems, then
  // handlers, which only the setup files and the tests import.
  ...mockLayers.map(({ kinds, kindsAbove }) => ({
    files: [`src/mocks/**/*.@(${kinds.join('|')}).ts`],
    rules: restrictImports({
      paths: wrappedLibraryImports,
      patterns: [
        ...publicApiPatterns,
        {
          regex: `\\.(${kindsAbove.join('|')})$`,
          message: `A ${kinds.join(', ')} file of the mocks does not read a ${kindsAbove.join(', ')} file: they sit above it.`,
        },
      ],
    }),
  })),
])
