import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { withFakeTimers } from '@/test/steps'

import { listProjects } from '../projects.api'
import { listQueryCases, queryNow } from './projects.api.data'

withFakeTimers({ toFake: ['Date'] })
beforeEach(() => {
  vi.setSystemTime(queryNow)
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
