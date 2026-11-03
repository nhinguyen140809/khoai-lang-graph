import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { sessionIds } from '../../shared/db'

const sessionPath = (sessionId: string) => apiEndpoints.session.path({ sessionId })
const notFound = { code: 'not_found', detail: 'The session does not exist.' }

/** The requests about the sessions that the mock refuses. */
export const sessionRejectedCases: RejectedRequestCase[] = [
  {
    name: 'answers 404 to DELETE of an unknown session',
    method: 'DELETE',
    path: sessionPath('no-such-session'),
    status: HttpStatus.NotFound,
    answer: notFound,
  },
  {
    name: 'answers 404 to DELETE of the revoked session',
    method: 'DELETE',
    path: sessionPath(sessionIds.revoked),
    status: HttpStatus.NotFound,
    answer: notFound,
  },
  {
    name: 'answers 500 to GET /me/sessions in the error scenario',
    method: 'GET',
    path: apiEndpoints.sessions.path(),
    page: '/?mock-sessions=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'answers 500 to DELETE of a session in the error scenario',
    method: 'DELETE',
    path: sessionPath(sessionIds.phone),
    page: '/?mock-revoke-session=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]
