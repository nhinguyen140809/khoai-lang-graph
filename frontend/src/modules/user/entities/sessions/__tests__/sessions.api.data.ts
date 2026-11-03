import { http, HttpResponse } from 'msw'

import { sessionIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { listSessions, revokeSession } from '../sessions.api'

const path = apiEndpoints.sessions.path()
const sessionPath = apiEndpoints.session.path({ sessionId: sessionIds.phone })

/** A call of the sessions API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'lists the sessions in the largest pages',
    call: () => listSessions(),
    request: { method: 'GET', path: `${path}?limit=200`, body: null },
  },
  {
    name: 'revokes a session',
    call: () => revokeSession(sessionIds.phone),
    request: { method: 'DELETE', path: sessionPath, body: null },
  },
] satisfies SentRequestCase[]

/** A call of the sessions API, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the sessions',
    refuse: () => serverErrorOn(HttpMethod.Get, path),
    call: () => listSessions(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load your sessions (HTTP 500)',
    },
  },
  {
    name: 'a failed revoke of a session',
    refuse: () => serverErrorOn(HttpMethod.Delete, sessionPath),
    call: () => revokeSession(sessionIds.phone),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to revoke the session (HTTP 500)',
    },
  },
  {
    name: 'a session that is already revoked',
    refuse: () =>
      http.delete(apiEndpoints.session.pattern, () =>
        HttpResponse.json(
          { status: HttpStatus.NotFound, code: 'not_found', detail: 'The session does not exist.' },
          { status: HttpStatus.NotFound },
        ),
      ),
    call: () => revokeSession(sessionIds.phone),
    error: { status: HttpStatus.NotFound, code: 'not_found' },
  },
]
