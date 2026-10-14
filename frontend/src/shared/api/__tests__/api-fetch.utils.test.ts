import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z, ZodError } from 'zod'

import { server } from '@/mocks/msw-server.setup'

import { ApiError } from '../api-error.utils'
import { apiCommand, apiRequest } from '../api-fetch.utils'

const itemSchema = z.object({ id: z.string() })

describe('apiRequest', () => {
  it('parses the response with the schema', async () => {
    server.use(http.get('/api/v1/things/1', () => HttpResponse.json({ id: '1', extra: true })))

    await expect(apiRequest('/api/v1/things/1', itemSchema, { action: 'load' })).resolves.toEqual({
      id: '1',
    })
  })

  it('turns a Problem Details body into an ApiError', async () => {
    server.use(
      http.post('/api/v1/things', () =>
        HttpResponse.json(
          {
            status: 422,
            code: 'validation_failed',
            detail: 'The name is missing.',
            errors: [{ field: 'name', message: 'Enter a name.' }],
          },
          { status: 422 },
        ),
      ),
    )

    const request = apiRequest('/api/v1/things', itemSchema, {
      action: 'create the thing',
      method: 'POST',
      body: {},
    })

    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'validation_failed',
      message: 'Failed to create the thing (HTTP 422): The name is missing.',
      fieldErrors: [{ field: 'name', message: 'Enter a name.' }],
    })
  })

  it('keeps the status when the error has no JSON body', async () => {
    server.use(http.get('/api/v1/things/1', () => new HttpResponse(null, { status: 502 })))

    const error: unknown = await apiRequest('/api/v1/things/1', itemSchema, {
      action: 'load the thing',
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 502,
      code: null,
      message: 'Failed to load the thing (HTTP 502)',
    })
  })

  it('sends a body as JSON, with the headers given', async () => {
    let sent: { method: string; type: string | null; trace: string | null; body: unknown } | null =
      null
    server.use(
      http.put('/api/v1/things/1', async ({ request }) => {
        sent = {
          method: request.method,
          type: request.headers.get('Content-Type'),
          trace: request.headers.get('X-Trace'),
          body: await request.json(),
        }
        return HttpResponse.json({ id: '1' })
      }),
    )

    await apiRequest('/api/v1/things/1', itemSchema, {
      action: 'save the thing',
      method: 'PUT',
      body: { name: 'A' },
      headers: { 'X-Trace': 't1' },
    })

    expect(sent).toEqual({
      method: 'PUT',
      type: 'application/json',
      trace: 't1',
      body: { name: 'A' },
    })
  })

  it('sends no content type without a body', async () => {
    let type: string | null = 'not read'
    server.use(
      http.get('/api/v1/things/1', ({ request }) => {
        type = request.headers.get('Content-Type')
        return HttpResponse.json({ id: '1' })
      }),
    )

    await apiRequest('/api/v1/things/1', itemSchema, { action: 'load the thing' })

    expect(type).toBeNull()
  })

  it('rejects an answer that does not match the schema', async () => {
    server.use(http.get('/api/v1/things/1', () => HttpResponse.json({ id: 1 })))

    await expect(
      apiRequest('/api/v1/things/1', itemSchema, { action: 'load the thing' }),
    ).rejects.toBeInstanceOf(ZodError)
  })

  it('keeps the plain message when the detail is empty', async () => {
    server.use(
      http.get('/api/v1/things/1', () =>
        HttpResponse.json({ status: 404, code: 'not_found', detail: '' }, { status: 404 }),
      ),
    )

    await expect(
      apiRequest('/api/v1/things/1', itemSchema, { action: 'load the thing' }),
    ).rejects.toMatchObject({ code: 'not_found', message: 'Failed to load the thing (HTTP 404)' })
  })
})

describe('apiCommand', () => {
  it('posts and reads no answer', async () => {
    let method = ''
    server.use(
      http.post('/api/v1/things/1/archive', ({ request }) => {
        method = request.method
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(
      apiCommand('/api/v1/things/1/archive', { action: 'archive the thing' }),
    ).resolves.toBeUndefined()
    expect(method).toBe('POST')
  })

  it('uses the method given', async () => {
    server.use(http.delete('/api/v1/things/1', () => new HttpResponse(null, { status: 204 })))

    await expect(
      apiCommand('/api/v1/things/1', { action: 'delete the thing', method: 'DELETE' }),
    ).resolves.toBeUndefined()
  })

  it('turns an error status into an ApiError', async () => {
    server.use(
      http.post('/api/v1/things/1/archive', () =>
        HttpResponse.json({ status: 409, code: 'invalid_state' }, { status: 409 }),
      ),
    )

    await expect(
      apiCommand('/api/v1/things/1/archive', { action: 'archive the thing' }),
    ).rejects.toMatchObject({ name: 'ApiError', status: 409, code: 'invalid_state' })
  })
})
