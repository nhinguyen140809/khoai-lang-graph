import { notFound } from '../shared/http/response'

/** The answer to a request that names a project the mock server does not hold. */
export function projectNotFound() {
  return notFound('The project')
}
