import { HttpResponse, type HttpResponseResolver } from 'msw'

import { ApiErrorCode, HttpStatus } from '@/shared/api/error/api-error.types'
import { idempotencyKeyHeader } from '@/shared/api/idempotency.constants'

import { mockRecord } from '../../db/mock-db.utils'
import { problem } from '../response/problem.utils'

interface StoredAnswer {
  /** The body of the request that the key came with. */
  requestBody: string
  status: number
  contentType: string | null
  text: string
}

// The answers to the keys seen so far, by the path and the key. The mock server keeps them until
// the records are reset, where the API keeps them for 24 hours.
const answers = mockRecord<Record<string, StoredAnswer>>('idempotent-answers', () => ({}))

function keyConflict() {
  return problem(
    HttpStatus.Conflict,
    ApiErrorCode.IdempotencyConflict,
    'Idempotency conflict',
    'The idempotency key was used before with a different body.',
  )
}

function repeatOf({ status, contentType, text }: StoredAnswer) {
  return new HttpResponse(text, {
    status,
    headers: contentType === null ? {} : { 'Content-Type': contentType },
  })
}

async function keep(storedAt: string, requestBody: string, response: Response) {
  answers.set({
    ...answers.get(),
    [storedAt]: {
      requestBody,
      status: response.status,
      contentType: response.headers.get('Content-Type'),
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
  return async (info) => {
    const key = info.request.headers.get(idempotencyKeyHeader)
    if (key === null) return resolver(info)
    const requestBody = await info.request.clone().text()
    const storedAt = `${new URL(info.request.url).pathname} ${key}`
    const stored = answers.get()[storedAt]
    if (stored !== undefined) {
      return stored.requestBody === requestBody ? repeatOf(stored) : keyConflict()
    }
    const response = await resolver(info)
    if (response instanceof Response && response.ok) await keep(storedAt, requestBody, response)
    return response
  }
}
