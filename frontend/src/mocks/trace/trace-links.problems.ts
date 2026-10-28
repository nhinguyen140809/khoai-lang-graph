import { notFound } from '../shared/http/response'

/** The answer to a request that names a link the mock server does not hold. */
export function traceLinkNotFound() {
  return notFound('The link')
}
