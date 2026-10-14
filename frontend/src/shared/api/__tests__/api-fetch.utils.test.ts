import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z, ZodError } from 'zod'

import { server } from '@/mocks/msw-server.setup'

import { ApiError } from '../api-error.utils'
import { apiCommand, apiRequest } from '../api-fetch.utils'
import { commandMethodCases, failedRequestCases, sentRequestCases } from './api-fetch.utils.data'

const itemSchema = z.object({ id: z.string() })

describe('apiRequest', () => {
  it('parses the response with the schema', async () => {
    server.use(http.get('/api/v1/things/1', () => HttpResponse.json({ id: '1', extra: true })))

    await expect(apiRequest('/api/v1/things/1', itemSchema, { action: 'load' })).resolves.toEqual({
      id: '1',
    })
  })

  it.each(failedRequestCases)(
    'turns $name into an ApiError',
    async ({ options, answer, error }) => {
      server.use(http.all('/api/v1/things/1', answer))

      const caught: unknown = await apiRequest('/api/v1/things/1', itemSchema, options).catch(
        (thrown: unknown) => thrown,
      )

      expect(caught).toBeInstanceOf(ApiError)
      expect(caught).toMatchObject(error)
    },
  )

  it.each(sentRequestCases)('sends $name', async ({ options, sent }) => {
    let received: unknown = null
    server.use(
      http.all('/api/v1/things/1', async ({ request }) => {
        const text = await request.text()
        received = {
          method: request.method,
          type: request.headers.get('Content-Type'),
          trace: request.headers.get('X-Trace'),
          body: text === '' ? null : (JSON.parse(text) as unknown),
        }
        return HttpResponse.json({ id: '1' })
      }),
    )

    await apiRequest('/api/v1/things/1', itemSchema, options)

    expect(received).toEqual(sent)
  })

  it('rejects an answer that does not match the schema', async () => {
    server.use(http.get('/api/v1/things/1', () => HttpResponse.json({ id: 1 })))

    await expect(
      apiRequest('/api/v1/things/1', itemSchema, { action: 'load the thing' }),
    ).rejects.toBeInstanceOf(ZodError)
  })
})

describe('apiCommand', () => {
  it.each(commandMethodCases)('$name and reads no answer', async ({ options, method }) => {
    let received = ''
    server.use(
      http.all('/api/v1/things/1', ({ request }) => {
        received = request.method
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(apiCommand('/api/v1/things/1', options)).resolves.toBeUndefined()
    expect(received).toBe(method)
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
