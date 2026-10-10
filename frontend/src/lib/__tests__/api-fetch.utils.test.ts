import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { server } from '@/mocks/msw-server.setup'

import { ApiError, apiRequest, fetchAllPages, isNotFoundError } from '../api-fetch.utils'

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
})

describe('fetchAllPages', () => {
  it('follows next_cursor until the last page', async () => {
    server.use(
      http.get('/api/v1/things', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return HttpResponse.json(
          cursor === null
            ? { items: [{ id: 'a' }, { id: 'b' }], next_cursor: 'page-2' }
            : { items: [{ id: 'c' }], next_cursor: null },
        )
      }),
    )

    await expect(fetchAllPages('/api/v1/things', itemSchema, 'load things')).resolves.toEqual([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ])
  })
})

describe('isNotFoundError', () => {
  it('is true only for an ApiError with status 404', () => {
    expect(isNotFoundError(new ApiError('x', 404, 'not_found', []))).toBe(true)
    expect(isNotFoundError(new ApiError('x', 500, null, []))).toBe(false)
    expect(isNotFoundError(new Error('x'))).toBe(false)
  })
})
