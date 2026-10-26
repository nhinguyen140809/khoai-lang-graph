import { notFound } from '../shared/http/response/error-response.utils'

/** The answer to a request that names a project the mock server does not hold. */
export function projectNotFound() {
  return notFound('The project')
}
