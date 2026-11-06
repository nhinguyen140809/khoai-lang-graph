import { delay, sse } from 'msw'

import { type RunStatus, type RunStep } from '@/modules/run/entities'
import { apiEndpoints } from '@/shared/api/endpoints'

import { allItems } from '../../artifacts/artifacts.lookup'
import { pathParam } from '../../shared/http/request'
import { artifactInProgress, findRun, stepsOfRun } from '../lookup/runs.lookup'

// Kept out of runs.handlers.ts, which the unit tests also load, because sse() needs a global
// EventSource, which jsdom does not provide. Only the browser worker loads this file; Playwright
// covers streaming.

const MOCK_TOKENS = ['Hello', ' from', ' the', ' **mock**', ' agent.']

// The usage of a stream that a step never wrote: nothing used.
const noUsage: RunStep['usage'] = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_tokens: 0,
  cache_write_tokens: 0,
  cost_usd: 0,
  duration_ms: 0,
}

/** The start of the last step of the run, with the fields the API carries. */
function nodeStartOf(step: RunStep | undefined) {
  const subject =
    step?.subject_item_id === null
      ? undefined
      : allItems().find((item) => item.id === step?.subject_item_id)
  return {
    node: step?.node ?? 'agent',
    step_id: step?.id ?? 'unknown',
    agent_role: step?.agent_role ?? null,
    stage: step?.stage ?? 'interviewing',
    iteration: step?.iteration ?? 0,
    persona_key: subject?.key ?? null,
  }
}

export const streamHandlers = [
  sse(apiEndpoints.runStream.pattern, async ({ client, params }) => {
    let id = 0
    const send = (event: string, payload: unknown) => {
      id += 1
      client.send({ id: String(id), event, data: JSON.stringify(payload) } as never)
    }

    const run = findRun(pathParam(params, 'runId'))
    const step = run === undefined ? undefined : stepsOfRun(run.id).at(-1)
    const start = nodeStartOf(step)
    const written = run?.status === 'running' ? artifactInProgress(run) : undefined
    if (run !== undefined && written !== undefined) {
      // The node in progress writes an artifact and goes on: the stream stays open, with no end.
      send('node_start', start)
      const item = step?.produced.at(-1)
      for (let count = 0; count < 3; count += 1) {
        await delay(400)
        send('artifact_delta', {
          artifact_id: written.id,
          delta: ' ...',
          version: written.version,
          item_id: item?.item_id ?? null,
          item_key: item?.key ?? null,
          change: 'item_created',
        })
      }
      return
    }

    send('node_start', start)
    for (const text of MOCK_TOKENS) {
      await delay(50)
      send('token', { node: start.node, text, step_id: start.step_id })
    }
    send('node_end', {
      node: start.node,
      step_id: start.step_id,
      status: 'succeeded',
      usage: step?.usage ?? noUsage,
    })
    const ended: Record<RunStatus, 'succeeded' | 'failed' | 'cancelled'> = {
      queued: 'succeeded',
      running: 'succeeded',
      interrupted: 'succeeded',
      succeeded: 'succeeded',
      failed: 'failed',
      cancelled: 'cancelled',
    }
    send('done', { status: run === undefined ? 'succeeded' : ended[run.status] })
  }),
]
