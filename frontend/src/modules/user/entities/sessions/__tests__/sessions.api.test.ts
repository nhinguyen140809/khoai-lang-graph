import { describe, expect, it } from 'vitest'

import { sessionIds } from '@/mocks/shared/db'
import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { listSessions, revokeSession } from '../sessions.api'
import { apiErrorCases, sentRequestCases } from './sessions.api.data'

describe('sessions api', () => {
  it('reads the three active sessions, the one of this browser first', async () => {
    const sessions = await listSessions()

    expect(sessions.map(({ id }) => id)).toEqual([
      sessionIds.current,
      sessionIds.phone,
      sessionIds.laptop,
    ])
    expect(sessions[0]?.current).toBe(true)
  })

  it('reads two sessions once one is revoked', async () => {
    await revokeSession(sessionIds.phone)

    expect((await listSessions()).map(({ id }) => id)).toEqual([
      sessionIds.current,
      sessionIds.laptop,
    ])
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
