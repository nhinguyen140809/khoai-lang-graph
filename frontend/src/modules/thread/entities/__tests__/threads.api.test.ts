import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { threadIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'

import { listThreads, sendFirstMessage } from '../threads.api'
import { createdThread, failedListCases, sentMessage } from './threads.api.data'

describe('listThreads', () => {
  it('returns the threads from the API', async () => {
    const threads = await listThreads()

    expect(threads.map(({ id }) => id)).toContain(threadIds.mentorMain)
  })

  it('returns an empty list when there are no threads', async () => {
    // One-off override: this test needs different data than the default fixture.
    server.use(
      http.get(apiEndpoints.threads.pattern, () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )

    await expect(listThreads()).resolves.toEqual([])
  })

  it.each(failedListCases)('throws on $name', async ({ answer, error }) => {
    server.use(http.get(apiEndpoints.threads.pattern, answer))

    await expect(listThreads()).rejects.toThrow(error)
  })
})

describe('sendFirstMessage', () => {
  it('sends the key with the message and not with the thread', async () => {
    const keys: Record<string, string | null> = {}
    server.use(
      http.post('/api/v1/projects/p1/threads', ({ request }) => {
        keys.thread = request.headers.get('Idempotency-Key')
        return HttpResponse.json(createdThread, { status: 201 })
      }),
      http.post('/api/v1/threads/t1/messages', ({ request }) => {
        keys.message = request.headers.get('Idempotency-Key')
        return HttpResponse.json(sentMessage, { status: 201 })
      }),
    )

    await sendFirstMessage('p1', 'An idea', 'key-1')

    expect(keys).toEqual({ thread: null, message: 'key-1' })
  })
})
