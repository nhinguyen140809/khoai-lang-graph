import { describe } from 'vitest'

import { itNestsQueryKeys, itTellsQueryKeysApart } from '@/test/suites'

import { distinctCases, keyCases } from './usage.keys.data'

describe('usageKeys', () => {
  itNestsQueryKeys(keyCases)

  itTellsQueryKeysApart(distinctCases)
})
