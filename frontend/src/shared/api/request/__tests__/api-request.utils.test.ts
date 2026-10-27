import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z, ZodError } from 'zod'

import { server } from '@/mocks/msw-server.setup'
import { noContent } from '@/mocks/shared/http/response'

import { apiEndpoint } from '../../endpoints'
import { ApiError } from '../../error'
import { HttpHeader, HttpStatus } from '../../http'
import { apiCommand, apiRequest } from '../api-request.utils'
import { commandMethodCases, failedRequestCases, sentRequestCases } from './api-request.utils.data'

const itemSchema = z.object({ id: z.string() })
const thing = apiEndpoint('/things/1')
const thingArchive = apiEndpoint('/things/1/archive')

describe('apiRequest', () => {
  it('parses the response with the schema', async () => {
    server.use(http.get(thing.path(), () => HttpResponse.json({ id: '1', extra: true })))

    await expect(apiRequest(thing.path(), itemSchema, { action: 'load' })).resolves.toEqual({
      id: '1',
    })
  })

  it.each(failedRequestCases)(
    'turns $name into an ApiError',
    async ({ options, answer, error }) => {
      server.use(http.all(thing.path(), answer))

      const caught: unknown = await apiRequest(thing.path(), itemSchema, options).catch(
        (thrown: unknown) => thrown,
      )

      expect(caught).toBeInstanceOf(ApiError)
      expect(caught).toMatchObject(error)
    },
  )

  it.each(sentRequestCases)('sends $name', async ({ options, sent }) => {
    let received: unknown = null
    server.use(
      http.all(thing.path(), async ({ request }) => {
        const text = await request.text()
        received = {
          method: request.method,
          type: request.headers.get(HttpHeader.ContentType),
          trace: request.headers.get('X-Trace'),
          key: request.headers.get(HttpHeader.IdempotencyKey),
          body: text === '' ? null : (JSON.parse(text) as unknown),
        }
        return HttpResponse.json({ id: '1' })
      }),
    )

    await apiRequest(thing.path(), itemSchema, options)

    expect(received).toEqual(sent)
  })

  it('rejects an answer that does not match the schema', async () => {
    server.use(http.get(thing.path(), () => HttpResponse.json({ id: 1 })))

    await expect(
      apiRequest(thing.path(), itemSchema, { action: 'load the thing' }),
    ).rejects.toBeInstanceOf(ZodError)
  })
})

describe('apiCommand', () => {
  it.each(commandMethodCases)('$name and reads no answer', async ({ options, method }) => {
    let received = ''
    server.use(
      http.all(thing.path(), ({ request }) => {
        received = request.method
        return noContent()
      }),
    )

    await expect(apiCommand(thing.path(), options)).resolves.toBeUndefined()
    expect(received).toBe(method)
  })

  it('turns an error status into an ApiError', async () => {
    server.use(
      http.post(thingArchive.path(), () =>
        HttpResponse.json(
          { status: HttpStatus.Conflict, code: 'invalid_state' },
          { status: HttpStatus.Conflict },
        ),
      ),
    )

    await expect(
      apiCommand(thingArchive.path(), { action: 'archive the thing' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: HttpStatus.Conflict,
      code: 'invalid_state',
    })
  })
})
