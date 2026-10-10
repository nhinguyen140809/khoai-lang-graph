import { http, HttpResponse } from 'msw'

import type { Thread } from '@/features/threads'

import { mockRecord } from './mock-db.utils'
import { createdId, USER_ID } from './mock-ids.constants'
import { answerScenario, mockRunState, mockScenario } from './mock-scenario.utils'
import { paginate } from './pagination.utils'
import { notFound } from './problem.utils'
import { findProject } from './projects.handlers'
import { mockThreads, withoutRuns } from './threads.fixtures'

// Threads created with POST /projects/{project_id}/threads.
const createdThreads = mockRecord<Thread[]>('created-threads', () => [])

// With `?mock-runs=empty`, no thread has a run yet.
function allThreads(): Thread[] {
  const threads = [...createdThreads.get(), ...mockThreads(mockRunState())]
  return mockScenario('runs') === 'empty' ? withoutRuns(threads) : threads
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
    const threads = allThreads().filter((thread) => thread.project_id === projectId)
    return HttpResponse.json(paginate(threads, request))
  }),

  http.post('/api/v1/projects/:projectId/threads', ({ params }) => {
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    const now = new Date().toISOString()
    const thread: Thread = {
      id: createdId('7f3a', createdThreads.get().length + 1),
      project_id: projectId,
      created_by: USER_ID,
      title: null,
      status: 'active',
      current_stage: null,
      active_run_id: null,
      active_run_status: null,
      last_message_at: now,
      created_at: now,
      updated_at: now,
    }
    createdThreads.set([thread, ...createdThreads.get()])
    return HttpResponse.json(thread, {
      status: 201,
      headers: { Location: `/api/v1/threads/${thread.id}` },
    })
  }),

  http.get('/api/v1/threads/:threadId', async ({ params }) => {
    const scenario = mockScenario('thread')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const thread =
      scenario === 'empty' ? undefined : allThreads().find(({ id }) => id === params.threadId)
    return thread === undefined ? notFound('The thread') : HttpResponse.json(thread)
  }),
]
