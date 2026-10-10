import { http, HttpResponse } from 'msw'

import { answerScenario, mockRunState, mockScenario } from './mock-scenario.utils'
import { paginate } from './pagination.utils'
import { notFound } from './problem.utils'
import { mockRuns, mockRunSteps } from './runs.fixtures'

export const MOCK_RUN_ID = 'run-mock-1'

// With `?mock-runs=empty`, no run exists.
function allRuns() {
  return mockScenario('runs') === 'empty' ? [] : mockRuns(mockRunState())
}

export const runHandlers = [
  // The request that the current chat page sends to start a run.
  // TODO: replace with POST /threads/{thread_id}/messages when the chat sends messages.
  http.post('/api/v1/threads/:threadId/runs', () => HttpResponse.json({ run_id: MOCK_RUN_ID })),

  http.get('/api/v1/threads/:threadId/runs', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('runs'))
    if (answered !== null) return answered
    const runs = allRuns()
      .filter((run) => run.thread_id === params.threadId)
      .toSorted((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))
    return HttpResponse.json(paginate(runs, request))
  }),

  http.get('/api/v1/runs/:runId', async ({ params }) => {
    const answered = await answerScenario(mockScenario('runs'))
    if (answered !== null) return answered
    const run = allRuns().find(({ id }) => id === params.runId)
    return run === undefined ? notFound('The run') : HttpResponse.json(run)
  }),

  http.get('/api/v1/runs/:runId/steps', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('runs'))
    if (answered !== null) return answered
    const runId = String(params.runId)
    if (!allRuns().some(({ id }) => id === runId)) return notFound('The run')
    return HttpResponse.json(paginate(mockRunSteps(runId, mockRunState()), request))
  }),
]
