import { describe } from 'vitest'

import { itNestsQueryKeys, itTellsQueryKeysApart } from '@/test/suites'

import { distinctCases, keyCases } from './run-steps.keys.data'

describe('runStepKeys', () => {
  itNestsQueryKeys(keyCases)

  itTellsQueryKeysApart(distinctCases)
})
