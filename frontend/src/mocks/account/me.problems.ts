import { notFound } from '../shared/http/response'

/** The answer to a request for a user the mock server does not hold. */
export function userNotFound() {
  return notFound('The user')
}
