import { describe } from 'vitest'

import { itNestsQueryKeys, itTellsQueryKeysApart } from '@/test/suites'

import { distinctCases, keyCases } from './runs.keys.data'

describe('runKeys', () => {
  itNestsQueryKeys(keyCases)

  itTellsQueryKeysApart(distinctCases)
})
