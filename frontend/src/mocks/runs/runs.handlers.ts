import { http, HttpResponse } from 'msw'

import type { Run, RunStep } from '@/features/threads'
import { isUnfinishedRunStatus } from '@/shared/config/run-status.constants'

import { extraRuns, extraRunSteps } from '../projects/extra-projects.fixtures'
import { createdId, IdPrefix } from '../shared/mock-ids.constants'
import { answerScenario, mockRunState, mockScenario } from '../shared/mock-scenario.utils'
import { paginate } from '../shared/pagination.utils'
import { invalidState, notFound } from '../shared/problem.utils'
import { changeRun, createdRuns, createdSteps, withRunChanges } from './mock-runs.store'
import { mockRuns, mockRunSteps, newMockRun } from './runs.fixtures'

// With `?mock-runs=empty`, no run exists.
export function allRuns(): Run[] {
  if (mockScenario('runs') === 'empty') return []
  return withRunChanges([...mockRuns(mockRunState()), ...extraRuns(), ...createdRuns.get()])
}

export function findMockRun(runId: string): Run | undefined {
  return allRuns().find(({ id }) => id === runId)
}

/** The steps of a run: the steps of the fixtures, or the ones the mock server played. */
export function stepsOfRun(runId: string): RunStep[] {
  return createdSteps.get()[runId] ?? extraRunSteps(runId) ?? mockRunSteps(runId, mockRunState())
}

/** Starts a run in a thread, numbered after the runs it already has. */
export function startMockRun(thread: { id: string; project_id: string }, retryOf: string | null) {
  const created = createdRuns.get()
  const number =
    Math.max(
      0,
      ...allRuns()
        .filter(({ thread_id }) => thread_id === thread.id)
        .map(({ number: n }) => n),
    ) + 1
  const run = newMockRun({
    id: createdId(IdPrefix.Run, created.length + 1),
    threadId: thread.id,
    projectId: thread.project_id,
    number,
    retryOfRunId: retryOf,
  })
  createdRuns.set([...created, run])
  return run
}

export const runHandlers = [
  http.get('/api/v1/threads/:threadId/runs', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('runs'))
    if (answered !== null) return answered
    const runs = allRuns()
      .filter((run) => run.thread_id === String(params.threadId))
      .toSorted((a, b) => b.number - a.number)
    return HttpResponse.json(paginate(runs, request))
  }),

  http.get('/api/v1/runs/:runId', async ({ params }) => {
    const answered = await answerScenario(mockScenario('runs'))
    if (answered !== null) return answered
    const run = findMockRun(String(params.runId))
    return run === undefined ? notFound('The run') : HttpResponse.json(run)
  }),

  http.get('/api/v1/runs/:runId/steps', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('runs'))
    if (answered !== null) return answered
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
