import { notFound } from '../shared/http/response/error-response.utils'

/** The answer to a request that names a run the mock server does not hold. */
export function runNotFound() {
  return notFound('The run')
}
