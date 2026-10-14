import { delay, sse } from 'msw'

// Kept out of runs.handlers.ts, which the unit tests also load, because sse() needs a global
// EventSource, which jsdom does not provide. Only the browser worker loads this file; Playwright
// covers streaming.

const MOCK_TOKENS = ['Hello', ' from', ' the', ' **mock**', ' agent.']

export const streamHandlers = [
  sse('/api/v1/runs/:runId/stream', async ({ client }) => {
    let id = 0
    const send = (event: string, data: unknown) => {
      id += 1
      client.send({ id: String(id), event, data: JSON.stringify(data) } as never)
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
