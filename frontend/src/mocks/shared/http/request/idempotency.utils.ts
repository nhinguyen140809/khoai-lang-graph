import { HttpResponse, type HttpResponseResolver } from 'msw'

import { ApiErrorCode } from '@/shared/api/error'
import { HttpHeader, HttpStatus } from '@/shared/api/http'

import { mockState } from '../../db/mock-state.utils'
import { errorResponse } from '../response/error-response.utils'

interface StoredAnswer {
  /** The body of the request that the key came with. */
  requestBody: string
  status: number
  contentType: string | null
  text: string
}

// The answers to the keys seen so far, by the path and the key. The mock server keeps them until
// the records are reset, where the API keeps them for 24 hours.
const answers = mockState<Record<string, StoredAnswer>>('idempotent-answers', () => ({}))

function keyConflict() {
  return errorResponse(
    HttpStatus.Conflict,
    ApiErrorCode.IdempotencyConflict,
    'Idempotency conflict',
    'The idempotency key was used before with a different body.',
  )
}

function repeatOf({ status, contentType, text }: StoredAnswer) {
  return new HttpResponse(text, {
    status,
    headers: contentType === null ? {} : { [HttpHeader.ContentType]: contentType },
  })
}

async function keep(storedAt: string, requestBody: string, response: Response) {
  answers.set({
    ...answers.get(),
    [storedAt]: {
      requestBody,
      status: response.status,
      contentType: response.headers.get(HttpHeader.ContentType),
      text: await response.clone().text(),
    },
  })
}

/**
 * A handler of a request that starts work, as the API answers a key: the first answer to a key is
 * kept, and a repeat with the same key gets it again without the work being done again. The same
 * key with another body answers 409. A request without a key, and an answer with an error status,
 * are not kept.
 */
export function idempotent(resolver: HttpResponseResolver): HttpResponseResolver {
  return async (requestInfo) => {
    const key = requestInfo.request.headers.get(HttpHeader.IdempotencyKey)
    if (key === null) return resolver(requestInfo)
    const requestBody = await requestInfo.request.clone().text()
    const storedAt = `${new URL(requestInfo.request.url).pathname} ${key}`
    const stored = answers.get()[storedAt]
    if (stored !== undefined) {
      return stored.requestBody === requestBody ? repeatOf(stored) : keyConflict()
    }
    const response = await resolver(requestInfo)
    if (response instanceof Response && response.ok) await keep(storedAt, requestBody, response)
    return response
  }
}
