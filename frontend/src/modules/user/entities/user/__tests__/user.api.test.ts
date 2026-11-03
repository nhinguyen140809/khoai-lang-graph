import { describe, expect, it } from 'vitest'

import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { changePassword, getMe, updateMe } from '../user.api'
import { apiErrorCases, passwordBody, sentRequestCases, updateBody } from './user.api.data'

describe('user api', () => {
  it('reads the signed-in user', async () => {
    await expect(getMe()).resolves.toMatchObject({
      email: 'linh.pham@example.com',
      display_name: 'Linh Pham',
    })
  })

  it('answers the user with the name that it saved', async () => {
    await expect(updateMe(updateBody)).resolves.toMatchObject({ display_name: 'Linh P.' })
    await expect(getMe()).resolves.toMatchObject({ display_name: 'Linh P.' })
  })

  it('changes the password of the fixtures', async () => {
    await expect(changePassword(passwordBody)).resolves.toBeUndefined()
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
