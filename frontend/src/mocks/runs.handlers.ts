import { http, HttpResponse } from 'msw'

import type { Run, RunStep } from '@/features/threads'

import { extraRuns, extraRunSteps } from './extra-projects.fixtures'
import { createdId } from './mock-ids.constants'
import {
  changeRun,
  createdRuns,
  createdSteps,
  unfinishedStatuses,
  withRunChanges,
} from './mock-runs.store'
import { answerScenario, mockRunState, mockScenario } from './mock-scenario.utils'
import { paginate } from './pagination.utils'
import { notFound, problem } from './problem.utils'
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
    id: createdId('5f2d', created.length + 1),
    threadId: thread.id,
    projectId: thread.project_id,
    number,
    retryOfRunId: retryOf,
  })
  createdRuns.set([...created, run])
  return run
}

// The pending review of a run that waits at the analysis review.
const pendingReview = {
  id: '7b0c0000-0000-4000-8000-000000000001',
  run_id: '',
  node: 'checkpoint_analysis',
  status: 'pending',
  prompt: 'Review the requirements analysis. Accept it, or reject it with feedback.',
  options: [
    { key: 'accept', label: 'Accept', requires_feedback: false, approves: true, is_default: true },
    {
      key: 'reject_reanalyse',
      label: 'Reject and re-analyse',
      requires_feedback: true,
      approves: false,
      is_default: false,
    },
    {
      key: 'reject_reinterview',
      label: 'Reject and re-interview',
      requires_feedback: true,
      approves: false,
      is_default: false,
    },
  ],
  questions: [],
  allow_edits: true,
  review_artifacts: [
    {
      artifact_id: 'b2100000-0000-4000-8000-000000000001',
      kind: 'requirements_analysis',
      title: 'Requirements analysis',
      version: 4,
    },
  ],
}

export const runHandlers = [
  http.get('/api/v1/threads/:threadId/runs', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('runs'))
    if (answered !== null) return answered
    const runs = allRuns()
      .filter((run) => run.thread_id === params.threadId)
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

  http.get('/api/v1/runs/:runId/interrupts', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('runs'))
    if (answered !== null) return answered
    const run = findMockRun(String(params.runId))
    if (run === undefined) return notFound('The run')
    const pending = run.status === 'interrupted' ? [{ ...pendingReview, run_id: run.id }] : []
    const status = new URL(request.url).searchParams.get('status')
    return HttpResponse.json(
      paginate(status === 'pending' || status === null ? pending : [], request),
    )
  }),

  http.post('/api/v1/runs/:runId/cancel', ({ params }) => {
    const run = findMockRun(String(params.runId))
    if (run === undefined) return notFound('The run')
    if (!unfinishedStatuses.includes(run.status)) {
      return problem(409, 'invalid_state', 'Invalid state', 'The run has already ended.')
    }
    changeRun(run.id, { status: 'cancelled', finished_at: new Date().toISOString() })
    return new HttpResponse(null, { status: 202 })
  }),
]
