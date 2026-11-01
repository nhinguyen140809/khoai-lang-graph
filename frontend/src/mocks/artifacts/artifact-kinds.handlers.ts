import { http, HttpResponse } from 'msw'

import { answerScenario, mockScenario } from '../shared/mock-scenario.utils'
import { mockArtifactKinds } from './artifact-kinds.fixtures'

export const artifactKindHandlers = [
  http.get('/api/v1/artifact-kinds', async () => {
    const scenario = mockScenario('artifact-kinds')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    return HttpResponse.json(
      scenario === 'empty' ? { ...mockArtifactKinds, artifact_kinds: [] } : mockArtifactKinds,
    )
  }),
]
