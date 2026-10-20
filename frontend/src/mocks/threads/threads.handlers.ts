import { http, HttpResponse } from 'msw'

import { isUnfinishedRunStatus, type Run } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'

import { extraThreads } from '../projects/extra-projects.fixtures'
import { findProject } from '../projects/projects.handlers'
import { allRuns } from '../runs/runs.handlers'
import { mockRecord } from '../shared/mock-db.utils'
import { createdId, IdPrefix } from '../shared/mock-ids.constants'
import { answerScenario, mockRunState, mockScenario } from '../shared/mock-scenario.utils'
import { emptyPage, paginate } from '../shared/pagination.utils'
import { notFound } from '../shared/problem.utils'
import { readBodyFields } from '../shared/request-body.utils'
import { buildMockThread, mockThreads, withoutRuns } from './threads.fixtures'

// Threads created with POST /projects/{project_id}/threads.
const createdThreads = mockRecord<Thread[]>('created-threads', () => [])

// With `?mock-runs=empty`, no thread has a run yet.
export function allThreads(): Thread[] {
  const threads = [...createdThreads.get(), ...mockThreads(mockRunState()), ...extraThreads()]
  if (mockScenario('runs') === 'empty') return withoutRuns(threads)
  const runs = allRuns()
  return threads.map((thread) => withRunsOfThread(thread, runs))
}

// A thread follows its latest run, which gives its status and its stage: a run stopped while the
// mock server runs leaves its thread without an unfinished run.
function withRunsOfThread(thread: Thread, runs: Run[]): Thread {
  const latest = runs
    .filter((run) => run.thread_id === thread.id)
    .toSorted((a, b) => b.number - a.number)[0]
  if (latest === undefined) return { ...thread, active_run_id: null, latest_run_status: null }
  return {
    ...thread,
    current_stage: latest.current_stage,
    active_run_id: isUnfinishedRunStatus(latest.status) ? latest.id : null,
    latest_run_status: latest.status,
  }
}

export const threadHandlers = [
  http.get('/api/v1/threads', async ({ request }) => {
    const scenario = await answerScenario('threads')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const projectId = new URL(request.url).searchParams.get('project_id')
    const threads = allThreads().filter(
      (thread) => projectId === null || thread.project_id === projectId,
    )
    return HttpResponse.json(paginate(threads, request))
  }),

  http.get('/api/v1/projects/:projectId/threads', async ({ params, request }) => {
    const scenario = await answerScenario('threads')
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const threads = allThreads()
      .filter((thread) => thread.project_id === projectId)
      .toSorted((a, b) => b.last_message_at.localeCompare(a.last_message_at))
    return HttpResponse.json(paginate(threads, request))
  }),

  http.post('/api/v1/projects/:projectId/threads', async ({ params, request }) => {
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    const { title } = await readBodyFields(request)
    const now = new Date().toISOString()
    const thread = buildMockThread({
      id: createdId(IdPrefix.Thread, createdThreads.get().length + 1),
      project_id: projectId,
      title: typeof title === 'string' && title.trim() !== '' ? title.trim() : null,
      current_stage: null,
      last_message_at: now,
      created_at: now,
      updated_at: now,
    })
    createdThreads.set([thread, ...createdThreads.get()])
    return HttpResponse.json(thread, {
      status: 201,
      headers: { Location: `/api/v1/threads/${thread.id}` },
    })
  }),

  http.get('/api/v1/threads/:threadId', async ({ params }) => {
    const scenario = await answerScenario('thread')
    const thread =
      scenario === 'empty'
        ? undefined
        : allThreads().find(({ id }) => id === String(params.threadId))
    return thread === undefined ? notFound('The thread') : HttpResponse.json(thread)
  }),
]
