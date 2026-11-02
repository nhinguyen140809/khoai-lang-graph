import { describe } from 'vitest'

import { itSendsRequests } from '@/test/suites'

import { sentRequestCases } from './revisions.api.data'

describe('revisions api', () => {
  itSendsRequests(sentRequestCases)
})
