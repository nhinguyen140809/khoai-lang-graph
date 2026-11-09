import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { server } from '@/mocks/msw-server.setup'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'

import { collectAllPages, fetchAllPages, fetchPage } from '../api-page.utils'
import { allPagesCases, pageCases, things } from './api-page.utils.data'

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

describe('fetchAllPages', () => {
  it.each(allPagesCases)('reads $name', async ({ pages, ids, queries }) => {
    const sent: string[] = []
    server.use(
      http.get(things.path(), ({ request }) => {
        sent.push(new URL(request.url).search)
        const page = pages[sent.length - 1]
        return HttpResponse.json({
          items: (page?.ids ?? []).map((id) => ({ id })),
          next_cursor: page?.next ?? null,
        })
      }),
    )

    const items = await fetchAllPages(things.path(), itemSchema, {
      limit: 2,
      action: 'load things',
    })

    expect(items.map(({ id }) => id)).toEqual(ids)
    expect(sent).toEqual(queries)
  })
})

describe('collectAllPages', () => {
  it('asks for the first page with no cursor, then for each page by the cursor of the one before', async () => {
    const asked: (string | null)[] = []
    const pages: Record<string, { items: string[]; next_cursor: string | null }> = {
      first: { items: ['a', 'b'], next_cursor: '2' },
      '2': { items: ['c'], next_cursor: '3' },
      '3': { items: ['d'], next_cursor: null },
    }

    const items = await collectAllPages((cursor) => {
      asked.push(cursor)
      return Promise.resolve(pages[cursor ?? 'first'] ?? { items: [], next_cursor: null })
    })

    expect(items).toEqual(['a', 'b', 'c', 'd'])
    expect(asked).toEqual([null, '2', '3'])
  })

  it('gives no items for a list that has none', async () => {
    await expect(
      collectAllPages(() => Promise.resolve({ items: [], next_cursor: null })),
    ).resolves.toEqual([])
  })

  it('stops with the error of a page that fails', async () => {
    await expect(collectAllPages(() => Promise.reject(new Error('page failed')))).rejects.toThrow(
      'page failed',
    )
  })
})
