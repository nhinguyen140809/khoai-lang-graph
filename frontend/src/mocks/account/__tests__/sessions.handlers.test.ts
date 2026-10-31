import { describe, expect, it } from 'vitest'

import type { Session } from '@/modules/user/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { deleteApi, fetchApi, getApi, getApiItems, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { sessionIds } from '../../shared/db'
import { sessionRejectedCases } from './sessions.handlers.data'

const sessionsPath = apiEndpoints.sessions.path()

describe('GET /me/sessions', () => {
  it('answers the sessions that are not revoked, one of them the current one', async () => {
    const sessions = await getApiItems<Session>(sessionsPath)

    expect(sessions).toHaveLength(3)
    expect(sessions.filter(({ current }) => current).map(({ id }) => id)).toEqual([
      sessionIds.current,
    ])
  })

  it('answers no session in the empty scenario', async () => {
    openPage('/?mock-sessions=empty')

    expect(await getApi(sessionsPath)).toEqual({ items: [], next_cursor: null })
  })
})

describe('DELETE /me/sessions/{session_id}', () => {
  it('revokes a session of another device', async () => {
    const answer = await deleteApi(apiEndpoints.session.path({ sessionId: sessionIds.phone }))

    expect(answer.status).toBe(HttpStatus.NoContent)
    expect((await getApiItems<Session>(sessionsPath)).map(({ id }) => id)).toEqual([
      sessionIds.current,
      sessionIds.laptop,
    ])
  })

  it('signs the user out when it revokes the session of this browser', async () => {
    const path = apiEndpoints.session.path({ sessionId: sessionIds.current })

    expect((await deleteApi(path)).status).toBe(HttpStatus.NoContent)

    expect(await fetchApi(apiEndpoints.me.path())).toMatchObject({
      status: HttpStatus.Unauthorized,
    })
  })

  it('answers 404 when a session is revoked twice', async () => {
    const path = apiEndpoints.session.path({ sessionId: sessionIds.laptop })
    await deleteApi(path)

    expect((await deleteApi(path)).status).toBe(HttpStatus.NotFound)
  })

  itRejectsRequests(sessionRejectedCases)
})
