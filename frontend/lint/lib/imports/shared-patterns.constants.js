import {
  mockHelpersIndexPattern,
  storageIndexPattern,
  testHelpersIndexPattern,
} from './folder-index-patterns.constants.js'
import { outsideLayersGroup } from './layer-patterns.constants.js'
import { messages } from './messages.constants.js'

/** What shared code, outside the modules, may not import. */
export const sharedCodePatterns = [
  {
    group: ['@/modules', '@/modules/**', ...outsideLayersGroup],
    message: messages.sharedCodeIsBelow,
  },
  {
    regex: '^(\\.\\./)+(modules|app|providers)(/|$)',
    message: messages.sharedCodeIsBelow,
  },
  {
    group: ['@/shared/components/frame', '@/shared/components/frame/**'],
    message:
      'Shared code does not import the frame. Inside src/shared/components/frame, use relative imports.',
  },
  storageIndexPattern,
  testHelpersIndexPattern,
  mockHelpersIndexPattern,
]
