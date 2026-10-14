import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { mockThreads } from '@/mocks/threads/threads.fixtures'

import { listThreads } from '../threads.api'

describe('listThreads', () => {
  it('returns the threads from the API', async () => {
    await expect(listThreads()).resolves.toEqual(mockThreads)
  })

  it('returns an empty list when there are no threads', async () => {
    // One-off override: this test needs different data than the default fixture.
    server.use(http.get('/api/v1/threads', () => HttpResponse.json({ items: [] })))

    await expect(listThreads()).resolves.toEqual([])
  })

  it('throws on an HTTP error', async () => {
    server.use(http.get('/api/v1/threads', () => new HttpResponse(null, { status: 500 })))

    await expect(listThreads()).rejects.toThrow('HTTP 500')
  })

  it('rejects a response that does not match the schema', async () => {
    server.use(http.get('/api/v1/threads', () => HttpResponse.json({ items: [{ id: 1 }] })))

    await expect(listThreads()).rejects.toThrow()
  })
})
