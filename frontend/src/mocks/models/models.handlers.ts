import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { emptyPage, paginate } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { allModels } from './models.lookup'

export const modelHandlers = [
  http.get(apiEndpoints.models.pattern, async ({ request }) => {
    const scenario = await answerScenario('models')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    return HttpResponse.json(paginate(allModels(), request))
  }),
]
