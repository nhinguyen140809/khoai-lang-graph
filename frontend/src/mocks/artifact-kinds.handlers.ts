import { http, HttpResponse } from 'msw'

import { mockArtifactKinds } from './artifact-kinds.fixtures'
import { answerScenario, mockScenario } from './mock-scenario.utils'

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
