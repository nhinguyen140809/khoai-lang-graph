import { http, HttpResponse } from 'msw'

import type { Run, Thread } from '@/features/threads'
import { isUnfinishedRunStatus, type UnfinishedRunStatus } from '@/shared/domain/run-status'

import { extraThreads } from '../projects/extra-projects.fixtures'
import { findProject } from '../projects/projects.handlers'
import { allRuns } from '../runs/runs.handlers'
import { answerScenario, mockRunState, mockScenario } from '../shared/mock-scenario.utils'
import { paginate } from '../shared/pagination.utils'
import { notFound } from '../shared/problem.utils'
import { mockThreads, withoutRuns } from './threads.fixtures'

// With `?mock-runs=empty`, no thread has a run yet.
export function allThreads(): Thread[] {
  const threads = [...mockThreads(mockRunState()), ...extraThreads()]
  if (mockScenario('runs') === 'empty') return withoutRuns(threads)
  const runs = allRuns()
  return threads.map((thread) => withRunsOfThread(thread, runs))
}

function isUnfinishedRun(run: Run): run is Run & { status: UnfinishedRunStatus } {
  return isUnfinishedRunStatus(run.status)
}

// The unfinished run of a thread follows the runs: a run stopped while the mock server runs
// leaves its thread without one.
function withRunsOfThread(thread: Thread, runs: Run[]): Thread {
  const active = runs
    .filter((run) => run.thread_id === thread.id)
    .toSorted((a, b) => b.number - a.number)
    .find(isUnfinishedRun)
  if (active === undefined) {
    return { ...thread, active_run_id: null, active_run_status: null }
  }
  return {
    ...thread,
    current_stage: active.current_stage,
    active_run_id: active.id,
    active_run_status: active.status,
  }
}

export const threadHandlers = [
  http.get('/api/v1/threads', async ({ request }) => {
    const scenario = mockScenario('threads')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    const projectId = new URL(request.url).searchParams.get('project_id')
    const threads = allThreads().filter(
      (thread) => projectId === null || thread.project_id === projectId,
    )
    return HttpResponse.json(paginate(threads, request))
  }),

  http.get('/api/v1/projects/:projectId/threads', async ({ params, request }) => {
    const scenario = mockScenario('threads')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    const threads = allThreads()
      .filter((thread) => thread.project_id === projectId)
      .toSorted((a, b) => b.last_message_at.localeCompare(a.last_message_at))
    return HttpResponse.json(paginate(threads, request))
  }),

  http.get('/api/v1/threads/:threadId', async ({ params }) => {
    const scenario = mockScenario('thread')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const thread =
      scenario === 'empty'
        ? undefined
        : allThreads().find(({ id }) => id === String(params.threadId))
    return thread === undefined ? notFound('The thread') : HttpResponse.json(thread)
  }),
]
