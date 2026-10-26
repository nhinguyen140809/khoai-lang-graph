import { describe, expect, it } from 'vitest'

import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getMe } from '../user.api'
import { apiErrorCases, sentRequestCases } from './user.api.data'

describe('user api', () => {
  it('reads the signed-in user', async () => {
    await expect(getMe()).resolves.toMatchObject({
      email: 'linh.pham@example.com',
      display_name: 'Linh Pham',
    })
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
