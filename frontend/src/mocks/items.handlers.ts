import { http, HttpResponse } from 'msw'

import { mockItems, searchMockItems } from './items.fixtures'
import { answerScenario, mockScenario } from './mock-scenario.utils'
import { paginate } from './pagination.utils'
import { notFound } from './problem.utils'
import { findProject } from './projects.handlers'

export const itemHandlers = [
  http.get('/api/v1/projects/:projectId/items', async ({ params, request }) => {
    const scenario = mockScenario('items')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    const q = new URL(request.url).searchParams.get('q') ?? ''
    const items = searchMockItems(q).filter((entry) => entry.project_id === projectId)
    return HttpResponse.json(paginate(items, request))
  }),

  http.get('/api/v1/items/:itemId', async ({ params }) => {
    const scenario = mockScenario('item')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    if (scenario === 'empty') return notFound('The item')
    const found = mockItems.find(({ id }) => id === params.itemId)
    return found === undefined ? notFound('The item') : HttpResponse.json(found)
  }),
]
