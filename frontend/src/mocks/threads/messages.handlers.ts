import { http, HttpResponse } from 'msw'

import type { Message } from '@/features/console'
import { isUnfinishedRunStatus } from '@/shared/config/run-status.constants'

import { extraMessages } from '../projects/extra-projects.fixtures'
import { createdMessages } from '../runs/mock-runs.store'
import { allRuns, findMockRun, startMockRun } from '../runs/runs.handlers'
import { createdId, IdPrefix } from '../shared/mock-ids.constants'
import { answerScenario, mockScenario } from '../shared/mock-scenario.utils'
import { paginate } from '../shared/pagination.utils'
import { invalidState, notFound, validationFailed } from '../shared/problem.utils'
import { mockMessages } from './messages.fixtures'
import { allThreads } from './threads.handlers'

// With `?mock-messages=empty`, the project has no message.
function allMessages(threadId: string): Message[] {
  if (mockScenario('messages') === 'empty') return []
  return [...mockMessages, ...extraMessages(), ...createdMessages.get()]
    .filter((message) => message.thread_id === threadId)
    .toSorted((a, b) => a.created_at.localeCompare(b.created_at))
    .map((message, index) => ({ ...message, sequence: index + 1 }))
}

export const messageHandlers = [
  http.get('/api/v1/threads/:threadId/messages', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('messages'))
    if (answered !== null) return answered
    return HttpResponse.json(paginate(allMessages(String(params.threadId)), request))
  }),

  http.post('/api/v1/threads/:threadId/messages', async ({ params, request }) => {
    const thread = allThreads().find(({ id }) => id === params.threadId)
    if (thread === undefined) return notFound('The thread')
    const body = (await request.json()) as { content?: unknown }
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    if (content === '') {
      return validationFailed([{ field: 'content', message: 'The message is empty.' }])
    }

    // A message sent while a run is unfinished waits for the run; otherwise it starts a run.
    const unfinished = allRuns()
      .filter((run) => run.thread_id === thread.id && isUnfinishedRunStatus(run.status))
      .toSorted((a, b) => b.number - a.number)[0]
    const run = unfinished ?? startMockRun(thread, null)
    const message: Message = {
      id: createdId(IdPrefix.Message, createdMessages.get().length + 1),
      thread_id: thread.id,
      sequence: allMessages(thread.id).length + 1,
      run_id: run.id,
      author: 'user',
      agent_role: null,
      content,
      delivery: unfinished === undefined ? 'started_run' : 'pending',
      delivered_in_step_id: null,
      created_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    }
    createdMessages.set([...createdMessages.get(), message])
    return HttpResponse.json({ message, run }, { status: 201 })
  }),

  http.post('/api/v1/runs/:runId/retry', ({ params }) => {
    const run = findMockRun(String(params.runId))
    if (run === undefined) return notFound('The run')
    const thread = allThreads().find(({ id }) => id === run.thread_id)
    if (thread === undefined) return notFound('The thread')
    if (thread.active_run_id !== null) {
      return invalidState('The thread has an unfinished run.')
    }
    return HttpResponse.json(startMockRun(thread, run.id), { status: 201 })
  }),
]
