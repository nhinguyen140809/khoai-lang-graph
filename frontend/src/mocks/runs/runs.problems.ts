import { notFound } from '../shared/http/response'

/** The answer to a request that names a run the mock server does not hold. */
export function runNotFound() {
  return notFound('The run')
}
