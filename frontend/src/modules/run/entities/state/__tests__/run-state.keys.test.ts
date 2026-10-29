import { describe } from 'vitest'

import { itNestsQueryKeys, itTellsQueryKeysApart } from '@/test/suites'

import { distinctCases, keyCases } from './run-state.keys.data'

describe('runStateKeys', () => {
  itNestsQueryKeys(keyCases)

  itTellsQueryKeysApart(distinctCases)
})
