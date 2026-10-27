import { describe } from 'vitest'

import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { apiErrorCases, sentRequestCases } from './auth.api.data'

describe('auth api', () => {
  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
