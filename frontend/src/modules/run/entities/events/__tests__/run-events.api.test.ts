import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { apiUrl } from '@/shared/api/request'

import { runEventsUrl } from '../run-events.api'
import { eventsUrlCases } from './run-events.api.data'

describe('runEventsUrl', () => {
  it.each(eventsUrlCases)('gives the address of the stream $name', ({ runId, after, query }) => {
    expect(runEventsUrl(runId, after)).toBe(
      `${apiUrl(apiEndpoints.runStream.path({ runId }))}${query}`,
    )
  })
})
