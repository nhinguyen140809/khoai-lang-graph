import { describe } from 'vitest'

import { itNestsQueryKeys } from '@/test/suites'

import { keyCases } from './user.keys.data'

describe('userKeys', () => {
  itNestsQueryKeys(keyCases)
})
