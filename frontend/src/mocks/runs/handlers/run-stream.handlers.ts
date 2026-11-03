import { delay, sse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { pathParam } from '../../shared/http/request'
import { artifactInProgress, findRun } from '../lookup/runs.lookup'

// Kept out of runs.handlers.ts, which the unit tests also load, because sse() needs a global
// EventSource, which jsdom does not provide. Only the browser worker loads this file; Playwright
// covers streaming.

const MOCK_TOKENS = ['Hello', ' from', ' the', ' **mock**', ' agent.']

export const streamHandlers = [
  sse(apiEndpoints.runStream.pattern, async ({ client, params }) => {
    let id = 0
    const send = (event: string, payload: unknown) => {
      id += 1
      client.send({ id: String(id), event, data: JSON.stringify(payload) } as never)
    }

    const run = findRun(pathParam(params, 'runId'))
    const written = run?.status === 'running' ? artifactInProgress(run) : undefined
    if (written !== undefined) {
      // The node in progress writes an artifact and goes on: the stream stays open, with no end.
      send('node_start', { node: 'agent' })
      for (let count = 0; count < 3; count += 1) {
        await delay(400)
        send('artifact_delta', { artifact_id: written.id, delta: ' ...' })
      }
      return
    }

    send('node_start', { node: 'agent' })
    for (const text of MOCK_TOKENS) {
      await delay(50)
      send('token', { node: 'agent', text })
    }
    send('node_end', { node: 'agent' })
    send('done', {})
  }),
]
