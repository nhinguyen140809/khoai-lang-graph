import { notFound } from '../shared/http/response/error-response.utils'

/** The answer to a request that names a thread the mock server does not hold. */
export function threadNotFound() {
  return notFound('The thread')
}
