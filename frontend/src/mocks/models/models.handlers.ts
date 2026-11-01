import { http, HttpResponse } from 'msw'

import { answerScenario, mockScenario } from '../shared/mock-scenario.utils'
import { paginate } from '../shared/pagination.utils'
import { mockModels } from './models.fixtures'

export const modelHandlers = [
  http.get('/api/v1/models', async ({ request }) => {
    const scenario = mockScenario('models')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    return HttpResponse.json(paginate(mockModels, request))
  }),
]
