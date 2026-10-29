import { describe } from 'vitest'

import { itNestsQueryKeys, itTellsQueryKeysApart } from '@/test/suites'

import { distinctCases, keyCases } from './artifact-kinds.keys.data'

describe('artifactKindKeys', () => {
  itNestsQueryKeys(keyCases)

  itTellsQueryKeysApart(distinctCases)
})
