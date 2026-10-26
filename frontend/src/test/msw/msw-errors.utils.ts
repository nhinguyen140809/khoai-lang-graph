import { http, HttpResponse } from 'msw'

import type { HttpMethod } from '@/shared/api/http'
import { HttpStatus } from '@/shared/api/http'

/** An answer of a handler that fails with a server error and no body. */
export function serverError() {
  return new HttpResponse(null, { status: HttpStatus.InternalServerError })
}

/** A handler that answers a server error to the requests of this method and path. */
export function serverErrorOn(method: HttpMethod, path: string) {
  return http[method.toLowerCase() as Lowercase<HttpMethod>](path, () => serverError())
}
