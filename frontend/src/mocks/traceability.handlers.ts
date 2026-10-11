import { http, HttpResponse } from 'msw'

import { answerScenario, mockScenario } from './mock-scenario.utils'
import { notFound } from './problem.utils'
import { findProject } from './projects.handlers'
import { mockCoverage, mockMatrixRows } from './traceability.fixtures'

export const traceabilityHandlers = [
  http.get('/api/v1/projects/:projectId/traceability/matrix', async ({ params }) => {
    const scenario = mockScenario('matrix')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (scenario === 'empty') return HttpResponse.json({ rows: [] })
    return HttpResponse.json({ rows: mockMatrixRows() })
  }),

  http.get('/api/v1/projects/:projectId/traceability/coverage', async ({ params }) => {
    const scenario = mockScenario('coverage')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    const empty = { count: 0, items: [] as never[] }
    const body =
      scenario === 'empty'
        ? { no_backlog_item: empty, no_source: empty, needs_review: empty }
        : mockCoverage()
    return HttpResponse.json(body)
  }),
]
