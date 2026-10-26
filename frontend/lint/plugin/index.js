import { booleanName } from './boolean-name.js'
import { findGetName } from './find-get-name.js'
import { retiredWords } from './retired-words.js'
import { sliceBoundary } from './slice-boundary.js'

/** The local rules: names that typescript-eslint does not cover, and the boundary of a slice. */
export default {
  rules: {
    'boolean-name': booleanName,
    'find-get-name': findGetName,
    'retired-words': retiredWords,
    'slice-boundary': sliceBoundary,
  },
}
