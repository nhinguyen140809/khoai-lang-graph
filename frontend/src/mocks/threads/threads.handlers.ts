import { http, HttpResponse } from 'msw'

import type { Thread } from '@/modules/thread/entities'
import { apiEndpoints } from '@/shared/api/endpoints'

import { findProject } from '../projects/projects.lookup'
import { projectNotFound } from '../projects/projects.problems'
import { refuseUnfinishedRun } from '../runs/runs.problems'
import { IdPrefix, mockNow, nextCreatedId } from '../shared/db'
import { pathParam, queryOf, readBodyFields } from '../shared/http/request'
import { created, emptyPage, noContent, paginate, validationFailed } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { changeThread, removeThread } from './threads.changes'
import { buildThread } from './threads.fixtures'
import { allThreads, findThread } from './threads.lookup'
import { threadNotFound } from './threads.problems'
import { createdThreads } from './threads.store'
import { validateNewThread, validateThreadChange } from './threads.validators'

// The order of every list of threads: the newest message first, ties by id.
function byLastMessage(a: Thread, b: Thread): number {
  return b.last_message_at.localeCompare(a.last_message_at) || a.id.localeCompare(b.id)
}

export const threadHandlers = [
  http.get(apiEndpoints.threads.pattern, async ({ request }) => {
    const scenario = await answerScenario('threads')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const projectId = queryOf(request).get('project_id')
    const threads = allThreads()
      .filter((thread) => projectId === null || thread.project_id === projectId)
      .toSorted(byLastMessage)
    return HttpResponse.json(paginate(threads, request))
  }),

  http.get(apiEndpoints.projectThreads.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('threads')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const threads = allThreads()
      .filter((thread) => thread.project_id === projectId)
      .toSorted(byLastMessage)
    return HttpResponse.json(paginate(threads, request))
  }),

  // Creates an empty thread; its first message starts the work.
  http.post(apiEndpoints.projectThreads.pattern, async ({ params, request }) => {
    await answerScenario('create-thread')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    const read = validateNewThread(await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    const now = mockNow()
    const thread = buildThread({
      id: nextCreatedId(IdPrefix.Thread, createdThreads),
      project_id: projectId,
      title: read.title,
      last_message_at: now,
      created_at: now,
      updated_at: now,
    })
    createdThreads.set([thread, ...createdThreads.get()])
    return created(thread, apiEndpoints.thread.path({ threadId: thread.id }))
  }),

  http.get(apiEndpoints.thread.pattern, async ({ params }) => {
    const scenario = await answerScenario('thread')
    const thread = scenario === 'empty' ? undefined : findThread(pathParam(params, 'threadId'))
    return thread === undefined ? threadNotFound() : HttpResponse.json(thread)
  }),

  // Takes the title and the status, which rename a thread, archive it or make it active again.
  http.patch(apiEndpoints.thread.pattern, async ({ params, request }) => {
    await answerScenario('update-thread')
    const threadId = pathParam(params, 'threadId')
    if (findThread(threadId) === undefined) return threadNotFound()
    const read = validateThreadChange(await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    changeThread(threadId, { ...read.change, updated_at: mockNow() })
    return HttpResponse.json(findThread(threadId))
  }),

  // A thread with a run that has not ended stays until the run is stopped; a deleted thread is
  // left out of the lists, and its endpoints miss it.
  http.delete(apiEndpoints.thread.pattern, async ({ params }) => {
    await answerScenario('delete-thread')
    const threadId = pathParam(params, 'threadId')
    if (findThread(threadId) === undefined) return threadNotFound()
    const refusal = refuseUnfinishedRun(threadId)
    if (refusal !== null) return refusal
    removeThread(threadId)
    return noContent()
  }),
]
