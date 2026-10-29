import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { startedRunId } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { itSendsRequests } from '@/test/suites'

import { createRun } from '../runs.api'
import { failedRunCases, sentRunRequestCases } from './runs.api.data'

describe('createRun', () => {
  it('returns the run id from the API', async () => {
    await expect(createRun('thread-1', 'hi')).resolves.toEqual({ run_id: startedRunId })
  })

  itSendsRequests(sentRunRequestCases)

  it.each(failedRunCases)('throws on $name', async ({ answer, error }) => {
    server.use(http.post(apiEndpoints.threadRuns.pattern, answer))

    await expect(createRun('thread-1', 'hi')).rejects.toThrow(error)
  })
})
