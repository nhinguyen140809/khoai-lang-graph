import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { findProject } from '../projects/projects.lookup'
import { projectNotFound } from '../projects/projects.problems'
import { createdId, IdPrefix, mockNow } from '../shared/db'
import { pathParam, queryOf, readBodyFields } from '../shared/http/request'
import { created, emptyPage, paginate } from '../shared/http/response'
import { requiredText } from '../shared/http/validation'
import { answerScenario } from '../shared/scenario'
import { buildThread } from './threads.fixtures'
import { allThreads } from './threads.lookup'
import { threadNotFound } from './threads.problems'
import { createdThreads } from './threads.store'

export const threadHandlers = [
  http.get(apiEndpoints.threads.pattern, async ({ request }) => {
    const scenario = await answerScenario('threads')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const projectId = queryOf(request).get('project_id')
    const threads = allThreads().filter(
      (thread) => projectId === null || thread.project_id === projectId,
    )
    return HttpResponse.json(paginate(threads, request))
  }),

  http.get(apiEndpoints.projectThreads.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('threads')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const threads = allThreads()
      .filter((thread) => thread.project_id === projectId)
      .toSorted((a, b) => b.last_message_at.localeCompare(a.last_message_at))
    return HttpResponse.json(paginate(threads, request))
  }),

  http.post(apiEndpoints.projectThreads.pattern, async ({ params, request }) => {
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    const { title } = await readBodyFields(request)
    const now = mockNow()
    const thread = buildThread({
      id: createdId(IdPrefix.Thread, createdThreads.get().length + 1),
      project_id: projectId,
      title: requiredText(title) ?? null,
      current_stage: null,
      last_message_at: now,
      created_at: now,
      updated_at: now,
    })
    createdThreads.set([thread, ...createdThreads.get()])
    return created(thread, apiEndpoints.thread.path({ threadId: thread.id }))
  }),

  http.get(apiEndpoints.thread.pattern, async ({ params }) => {
    const scenario = await answerScenario('thread')
    const thread =
      scenario === 'empty'
        ? undefined
        : allThreads().find(({ id }) => id === pathParam(params, 'threadId'))
    return thread === undefined ? threadNotFound() : HttpResponse.json(thread)
  }),
]
