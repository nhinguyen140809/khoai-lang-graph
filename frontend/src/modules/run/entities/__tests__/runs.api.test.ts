import { http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { mockRunId } from '@/mocks/runs/handlers/runs.handlers'
import { apiEndpoints } from '@/shared/api/endpoints'

import { createRun } from '../runs.api'
import { failedRunCases } from './runs.api.data'

afterEach(() => {
  server.events.removeAllListeners()
})

describe('createRun', () => {
  it('returns the run id from the API', async () => {
    await expect(createRun('thread-1', 'hi')).resolves.toEqual({ run_id: mockRunId })
  })

  it('sends the message as the input of a run of the thread, its id encoded', async () => {
    const sent: { path: string; body: unknown }[] = []
    server.events.on('request:start', ({ request }) => {
      void request
        .clone()
        .json()
        .then((body: unknown) => {
          sent.push({ path: new URL(request.url).pathname, body })
        })
    })

    await createRun('thread 1', 'hi')

    await expect
      .poll(() => sent)
      .toEqual([{ path: '/api/v1/threads/thread%201/runs', body: { input: 'hi' } }])
  })

  it.each(failedRunCases)('throws on $name', async ({ answer, error }) => {
    server.use(http.post(apiEndpoints.threadRuns.pattern, answer))

    await expect(createRun('thread-1', 'hi')).rejects.toThrow(error)
  })
})
