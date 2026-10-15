import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { THREAD_IDS } from '@/mocks/shared/mock-ids.constants'

import { listThreads } from '../threads.api'
import { failedListCases } from './threads.api.data'

describe('listThreads', () => {
  it('returns the threads from the API', async () => {
    const threads = await listThreads()

    expect(threads.map(({ id }) => id)).toContain(THREAD_IDS.mentorMain)
  })

  it('returns an empty list when there are no threads', async () => {
    // One-off override: this test needs different data than the default fixture.
    server.use(
      http.get('/api/v1/threads', () => HttpResponse.json({ items: [], next_cursor: null })),
    )

    await expect(listThreads()).resolves.toEqual([])
  })

  it.each(failedListCases)('throws on $name', async ({ answer, error }) => {
    server.use(http.get('/api/v1/threads', answer))

    await expect(listThreads()).rejects.toThrow(error)
  })
})
