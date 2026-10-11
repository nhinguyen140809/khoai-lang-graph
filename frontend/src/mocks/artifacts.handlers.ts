import { http, HttpResponse } from 'msw'

import { mockArtifacts } from './artifacts.fixtures'
import { answerScenario, mockScenario } from './mock-scenario.utils'
import { paginate } from './pagination.utils'
import { notFound } from './problem.utils'
import { findProject } from './projects.handlers'

export const artifactHandlers = [
  http.get('/api/v1/projects/:projectId/artifacts', async ({ params, request }) => {
    const scenario = mockScenario('artifacts')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    const artifacts = mockArtifacts.filter((entry) => entry.project_id === projectId)
    return HttpResponse.json(paginate(artifacts, request))
  }),
]
