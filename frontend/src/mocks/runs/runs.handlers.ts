import { http, HttpResponse } from 'msw'

import type { Run, RunStep } from '@/modules/run/entities'
import { isUnfinishedRunStatus } from '@/modules/run/entities'

import { extraRuns, extraRunSteps } from '../projects/extra-projects.fixtures'
import { answerScenario, mockRunState, mockScenario } from '../shared/mock-scenario.utils'
import { paginate } from '../shared/pagination.utils'
import { invalidState, notFound } from '../shared/problem.utils'
import { changeRun, createdRuns, withRunChanges } from './mock-runs.store'
import { mockRuns, mockRunSteps } from './runs.fixtures'

// With `?mock-runs=empty`, no run exists.
export function allRuns(): Run[] {
  if (mockScenario('runs') === 'empty') return []
  return withRunChanges([...createdRuns.get(), ...mockRuns(mockRunState()), ...extraRuns()])
}

export function findMockRun(runId: string): Run | undefined {
  return allRuns().find(({ id }) => id === runId)
}

/** The steps of a run of the fixtures. */
export function stepsOfRun(runId: string): RunStep[] {
  return extraRunSteps(runId) ?? mockRunSteps(runId, mockRunState())
}

// The chat starts a run with this endpoint, which is not part of the API; it goes with the chat.
export const MOCK_RUN_ID = 'run-mock-1'

export const runHandlers = [
  http.post('/api/v1/threads/:threadId/runs', () => HttpResponse.json({ run_id: MOCK_RUN_ID })),

  http.get('/api/v1/threads/:threadId/runs', async ({ params, request }) => {
    await answerScenario('runs')
    const runs = allRuns()
      .filter((run) => run.thread_id === String(params.threadId))
      .toSorted((a, b) => b.number - a.number)
    return HttpResponse.json(paginate(runs, request))
  }),

  http.get('/api/v1/runs/:runId', async ({ params }) => {
    await answerScenario('runs')
    const run = findMockRun(String(params.runId))
    return run === undefined ? notFound('The run') : HttpResponse.json(run)
  }),

  http.get('/api/v1/runs/:runId/steps', async ({ params, request }) => {
    await answerScenario('runs')
    const runId = String(params.runId)
    if (findMockRun(runId) === undefined) return notFound('The run')
    return HttpResponse.json(paginate(stepsOfRun(runId), request))
  }),

  http.post('/api/v1/runs/:runId/cancel', ({ params }) => {
    const run = findMockRun(String(params.runId))
    if (run === undefined) return notFound('The run')
    if (!isUnfinishedRunStatus(run.status)) return invalidState('The run has already ended.')
    changeRun(run.id, { status: 'cancelled', finished_at: new Date().toISOString() })
    return new HttpResponse(null, { status: 202 })
  }),
]
