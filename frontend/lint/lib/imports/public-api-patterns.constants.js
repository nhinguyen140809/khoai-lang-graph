import {
  mockHelpersIndexPattern,
  storageIndexPattern,
  testHelpersIndexPattern,
} from './folder-index-patterns.constants.js'
import { messages } from './messages.constants.js'

const entitiesIndexPattern = { regex: '^@/modules/[^/]+/entities/', message: messages.publicApi }

// A slice is used through its index.ts only, from any layer above it; inside a slice, files use
// relative imports. The files of the @x folder of an entity are for the entities of other modules.
// These are the patterns of that rule without the one for entities: a file of an entity gets its
// own rule for the other entities, and takes these alone.
export const nonEntityPublicApiPatterns = [
  { regex: '^@/modules/[^/]+/(features|widgets)/[^/]+/', message: messages.publicApi },
  {
    regex: '^(\\.\\./)+(src/)?modules/',
    message: 'Import a slice with @/, from its index.',
  },
  {
    group: ['@/shared/components/frame/**'],
    message: 'Import the frame from @/shared/components/frame, its index.',
  },
  storageIndexPattern,
  testHelpersIndexPattern,
  mockHelpersIndexPattern,
]

export const publicApiPatterns = [entitiesIndexPattern, ...nonEntityPublicApiPatterns]
