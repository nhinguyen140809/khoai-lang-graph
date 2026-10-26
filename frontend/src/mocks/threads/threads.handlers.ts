import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { findProject } from '../projects/projects.lookup'
import { projectNotFound } from '../projects/projects.problems'
import { mockNow } from '../shared/db/mock-clock.utils'
import { IdPrefix } from '../shared/db/mock-ids.constants'
import { createdId } from '../shared/db/mock-ids.utils'
import { readBodyFields } from '../shared/http/request/request-body.utils'
import { emptyPage, paginate } from '../shared/http/response/pagination.utils'
import { created } from '../shared/http/response/status-response.utils'
import { requiredText } from '../shared/http/validation/field-values.utils'
import { answerScenario } from '../shared/scenario/mock-scenario.utils'
import { buildThread } from './threads.fixtures'
import { allThreads } from './threads.lookup'
import { threadNotFound } from './threads.problems'
import { createdThreads } from './threads.store'

export const threadHandlers = [
  http.get(apiEndpoints.threads.pattern, async ({ request }) => {
    const scenario = await answerScenario('threads')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const projectId = new URL(request.url).searchParams.get('project_id')
    const threads = allThreads().filter(
      (thread) => projectId === null || thread.project_id === projectId,
    )
    return HttpResponse.json(paginate(threads, request))
  }),

  http.get(apiEndpoints.projectThreads.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('threads')
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const threads = allThreads()
      .filter((thread) => thread.project_id === projectId)
      .toSorted((a, b) => b.last_message_at.localeCompare(a.last_message_at))
    return HttpResponse.json(paginate(threads, request))
  }),

  http.post(apiEndpoints.projectThreads.pattern, async ({ params, request }) => {
    const projectId = String(params.projectId)
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
        : allThreads().find(({ id }) => id === String(params.threadId))
    return thread === undefined ? threadNotFound() : HttpResponse.json(thread)
  }),
]
