import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'

import { listProjects } from '../projects.api'
import { listQueryCases, queryNow } from './projects.api.data'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(queryNow)
})

afterEach(() => {
  vi.useRealTimers()
  server.events.removeAllListeners()
})

describe('listProjects', () => {
  it.each(listQueryCases)('asks for $name', async ({ filters, query }) => {
    const asked: URL[] = []
    server.events.on('request:start', ({ request }) => {
      asked.push(new URL(request.url))
    })

    await listProjects('active', null, 50, filters)

    // The parameters of the page are the same for every list.
    const [url] = asked
    url?.searchParams.delete('limit')
    expect(url?.searchParams.toString()).toBe(query)
  })
})
