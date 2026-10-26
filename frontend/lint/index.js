import { booleanName } from './boolean-name.js'
import { findGetName } from './find-get-name.js'
import { retiredWords } from './retired-words.js'

/** The rules of naming that the type-aware rules of typescript-eslint do not cover. */
export default {
  rules: {
    'boolean-name': booleanName,
    'find-get-name': findGetName,
    'retired-words': retiredWords,
  },
}
