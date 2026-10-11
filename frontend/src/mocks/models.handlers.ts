import { http, HttpResponse } from 'msw'

import { answerScenario, mockScenario } from './mock-scenario.utils'
import { mockModels } from './models.fixtures'
import { paginate } from './pagination.utils'

export const modelHandlers = [
  http.get('/api/v1/models', async ({ request }) => {
    const scenario = mockScenario('models')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    return HttpResponse.json(paginate(mockModels, request))
  }),
]
