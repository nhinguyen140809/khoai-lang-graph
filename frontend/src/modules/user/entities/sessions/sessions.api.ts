import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiCommand, fetchAllPages } from '@/shared/api/request'

import { sessionsPageSize } from './sessions.constants'
import { type Session, sessionSchema } from './sessions.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The sessions of the user that are not revoked or expired, the last seen first. */
export function listSessions(): Promise<Session[]> {
  return fetchAllPages(apiEndpoints.sessions.path(), sessionSchema, {
    limit: sessionsPageSize,
    action: 'load your sessions',
  })
}

/** Ends a session; ending the session of this browser logs the user out. */
export function revokeSession(sessionId: string): Promise<void> {
  return apiCommand(apiEndpoints.session.path({ sessionId }), {
    action: 'revoke the session',
    method: HttpMethod.Delete,
  })
}
