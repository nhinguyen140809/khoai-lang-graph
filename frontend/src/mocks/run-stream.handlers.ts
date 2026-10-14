import { delay, sse } from 'msw'

import type { RunStep } from '@/features/threads'

import { createdId, IdPrefix } from './mock-ids.constants'
import { changeRun, createdRuns, createdSteps } from './mock-runs.store'
import { pageParam } from './mock-scenario.utils'
import { findMockRun } from './runs.handlers'

// Kept out of runs.handlers.ts, which the unit tests also load, because sse() needs a global
// EventSource, which jsdom does not provide. Only the browser worker loads this file; Playwright
// covers streaming.
//
// A run that was started while the mock server runs is played: each step starts, writes some
// text and ends, then the run is done. A run of the fixtures only holds the stream open: a
// running one prints the step it is in, and one that waits for review sends its interrupt.

const STEP_DELAY_MS = 700

const playedSteps = [
  {
    node: 'planner',
    stage: 'planning',
    words: ['An elicitation plan', ' for', ' the', ' **product.**'],
  },
  {
    node: 'persona_generator',
    stage: 'persona_generation',
    words: ['Three', ' personas', ' that', ' match', ' the', ' idea.'],
  },
  { node: 'analyst', stage: 'analysis', words: ['Grouping', ' the', ' raw', ' requirements.'] },
]

function stepRecord(
  runId: string,
  sequence: number,
  played: (typeof playedSteps)[number],
  startedAt: string,
): RunStep {
  return {
    id: createdId(IdPrefix.Step, sequence + 100 * createdRuns.get().length),
    run_id: runId,
    sequence,
    node: played.node,
    agent_role: played.node,
    stage: played.stage,
    status: 'running',
    iteration: 0,
    subject_item_id: null,
    model_id: null,
    llm_calls: 1,
    usage: {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_write_tokens: 0,
      cost_usd: 0,
      duration_ms: 0,
    },
    produced: [],
    error: null,
    started_at: startedAt,
    finished_at: null,
  }
}

export const streamHandlers = [
  sse('/api/v1/runs/:runId/stream', async ({ client, params }) => {
    let id = 0
    // The mock stream reaches the page when the handler returns, so a run that waits does not
    // hold it open: it says when to try again, a long time from now, and closes.
    const wait = () => {
      client.send({ retry: 3_600_000 })
    }
    const send = (event: string, data: unknown) => {
      id += 1
      client.send({ id: String(id), event, data: JSON.stringify(data) } as never)
    }
    const runId = String(params.runId)
    const run = findMockRun(runId)
    const played = createdRuns.get().some((created) => created.id === runId)

    if (
      run === undefined ||
      (run.status !== 'running' && run.status !== 'interrupted' && !played)
    ) {
      send('done', {})
      return
    }

    if (run.status === 'interrupted') {
      send('node_start', { node: 'checkpoint_analysis' })
      send('interrupt', { node: 'checkpoint_analysis', payload: {} })
      wait()
      return
    }

    if (!played) {
      send('node_start', { node: run.current_stage })
      wait()
      return
    }

    createdSteps.set({ ...createdSteps.get(), [runId]: [] })
    for (const [index, step] of playedSteps.entries()) {
      const startedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
      const record = stepRecord(runId, index + 1, step, startedAt)
      createdSteps.set({
        ...createdSteps.get(),
        [runId]: [...(createdSteps.get()[runId] ?? []), record],
      })
      changeRun(runId, { current_stage: step.stage, step_count: index + 1 })
      send('node_start', { node: step.node })
      for (const text of step.words) {
        await delay(60)
        send('token', { node: step.node, text })
      }
      await delay(STEP_DELAY_MS)
      const finishedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
      createdSteps.set({
        ...createdSteps.get(),
        [runId]: (createdSteps.get()[runId] ?? []).map((item) =>
          item.sequence === record.sequence
            ? {
                ...item,
                status: 'succeeded',
                finished_at: finishedAt,
                usage: {
                  ...item.usage,
                  duration_ms: Date.parse(finishedAt) - Date.parse(startedAt),
                },
              }
            : item,
        ),
      })
      send('node_end', { node: step.node })
    }
    // With `?mock-play=review`, the played run stops at the review of the personas.
    if (pageParam('mock-play') === 'review') {
      changeRun(runId, { status: 'interrupted', current_stage: 'persona_review' })
      send('interrupt', { node: 'checkpoint_personas', payload: {} })
      wait()
      return
    }
    changeRun(runId, {
      status: 'succeeded',
      current_stage: 'done',
      finished_at: new Date().toISOString(),
    })
    send('done', {})
  }),
]
