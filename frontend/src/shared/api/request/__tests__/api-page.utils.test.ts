import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { server } from '@/mocks/msw-server.setup'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'

import { fetchPage } from '../api-page.utils'
import { pageCases, things } from './api-page.utils.data'

const itemSchema = z.object({ id: z.string() })

describe('fetchPage', () => {
  it.each(pageCases)('reads $name', async ({ path, limit, cursor, query }) => {
    const queries: string[] = []
    server.use(
      http.get(things.path(), ({ request }) => {
        queries.push(new URL(request.url).search)
        return HttpResponse.json({ items: [{ id: 'a', extra: true }], next_cursor: 'next' })
      }),
    )

    await expect(
      fetchPage(path, itemSchema, { limit, cursor, action: 'load things' }),
    ).resolves.toEqual({ items: [{ id: 'a' }], next_cursor: 'next' })
    expect(queries).toEqual([query])
  })

  it('turns a failed page into an ApiError', async () => {
    server.use(serverErrorOn(HttpMethod.Get, things.path()))

    await expect(
      fetchPage(things.path(), itemSchema, { limit: 10, cursor: null, action: 'load things' }),
    ).rejects.toMatchObject({ name: 'ApiError', message: 'Failed to load things (HTTP 500)' })
  })
})
