import { notFound } from '../shared/http/response'

/** The answer to a request that names an export the mock server does not hold. */
export function exportNotFound() {
  return notFound('The export')
}
