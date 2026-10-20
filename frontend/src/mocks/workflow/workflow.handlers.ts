import { http, HttpResponse } from 'msw'

import { answerScenario } from '../shared/mock-scenario.utils'
import definition from './requirements_engineering.v1.json'

export const workflowHandlers = [
  // Every run of the mock data runs version 1, so `?version=` reads it too.
  http.get('/api/v1/workflow/definition', async () => {
    await answerScenario('workflow')
    return HttpResponse.json(definition)
  }),
]
