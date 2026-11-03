import { notFound } from '../shared/http/response'

/** The answer to a request for a session that is revoked, expired or not the user's. */
export function sessionNotFound() {
  return notFound('The session')
}
