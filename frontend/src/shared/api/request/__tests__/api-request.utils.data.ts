import { HttpResponse } from 'msw'

import type { apiCommand } from '../api-request.utils'

type Options = Parameters<typeof apiCommand>[1]

/** The options of a request, the answer to it, and the ApiError that apiRequest throws. */
export const failedRequestCases: {
  name: string
  options: Options
  answer: () => Response
  error: Record<string, unknown>
}[] = [
  {
    name: 'a Problem Details body',
    options: { action: 'create the thing', method: 'POST', body: {} },
    answer: () =>
      HttpResponse.json(
        {
          status: 422,
          code: 'validation_failed',
          detail: 'The name is missing.',
          errors: [{ field: 'name', message: 'Enter a name.' }],
        },
        { status: 422 },
      ),
    error: {
      status: 422,
      code: 'validation_failed',
      message: 'Failed to create the thing (HTTP 422): The name is missing.',
      fieldErrors: [{ field: 'name', message: 'Enter a name.' }],
    },
  },
  {
    name: 'an error without a body',
    options: { action: 'load the thing' },
    answer: () => new HttpResponse(null, { status: 502 }),
    error: { status: 502, code: null, message: 'Failed to load the thing (HTTP 502)' },
  },
  {
    name: 'an error with a text body',
    options: { action: 'load the thing' },
    answer: () => new HttpResponse('Service Unavailable', { status: 503 }),
    error: { status: 503, code: null, message: 'Failed to load the thing (HTTP 503)' },
  },
  {
    name: 'a Problem Details body with an empty detail',
    options: { action: 'load the thing' },
    answer: () =>
      HttpResponse.json({ status: 404, code: 'not_found', detail: '' }, { status: 404 }),
    error: { status: 404, code: 'not_found', message: 'Failed to load the thing (HTTP 404)' },
  },
]

/** The options of a request, and what the server receives. */
export const sentRequestCases: {
  name: string
  options: Options
  sent: {
    method: string
    type: string | null
    trace: string | null
    key: string | null
    body: unknown
  }
}[] = [
  {
    name: 'a body as JSON, with the headers given',
    options: {
      action: 'save the thing',
      method: 'PUT',
      body: { name: 'A' },
      headers: { 'X-Trace': 't1' },
    },
    sent: { method: 'PUT', type: 'application/json', trace: 't1', key: null, body: { name: 'A' } },
  },
  {
    name: 'no content type without a body',
    options: { action: 'load the thing' },
    sent: { method: 'GET', type: null, trace: null, key: null, body: null },
  },
  {
    name: 'an idempotency key as a header, with the body',
    options: { action: 'send the thing', method: 'POST', body: { a: 1 }, idempotencyKey: 'k1' },
    sent: { method: 'POST', type: 'application/json', trace: null, key: 'k1', body: { a: 1 } },
  },
  {
    name: 'an idempotency key without a body',
    options: { action: 'retry the thing', method: 'POST', idempotencyKey: 'k2' },
    sent: { method: 'POST', type: null, trace: null, key: 'k2', body: null },
  },
]

/** The options of a command, and the method it is sent with. */
export const commandMethodCases: { name: string; options: Options; method: string }[] = [
  { name: 'posts by default', options: { action: 'archive the thing' }, method: 'POST' },
  {
    name: 'uses the method given',
    options: { action: 'delete the thing', method: 'DELETE' },
    method: 'DELETE',
  },
]

