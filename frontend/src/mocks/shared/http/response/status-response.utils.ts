import { HttpResponse, type JsonBodyType } from 'msw'

import { HttpHeader, HttpStatus } from '@/shared/api/http'

/** An answer with a status and no body, such as `emptyResponse(HttpStatus.Conflict)`. */
export function emptyResponse(status: HttpStatus) {
  return new HttpResponse(null, { status })
}

/** The answer of an endpoint that does its work and sends no body. */
export function noContent() {
  return emptyResponse(HttpStatus.NoContent)
}

/** The answer of an endpoint that creates a record: it sends the record, and where to read it. */
export function created(body: JsonBodyType, location?: string) {
  return HttpResponse.json(body, {
    status: HttpStatus.Created,
    ...(location !== undefined && { headers: { [HttpHeader.Location]: location } }),
  })
}

/** The answer of an endpoint that accepts the work and does it later. */
export function accepted(body: JsonBodyType) {
  return HttpResponse.json(body, { status: HttpStatus.Accepted })
}
