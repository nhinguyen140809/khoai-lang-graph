import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { queryOf } from '../shared/http/request'
import { invalidRequest } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { usageOfMonth } from './usage.lookup'
import { validateUsageQuery } from './usage.validators'

export const usageHandlers = [
  http.get(apiEndpoints.usage.pattern, async ({ request }) => {
    const scenario = await answerScenario('usage')
    const checked = validateUsageQuery(queryOf(request))
    if ('problem' in checked) return invalidRequest(checked.problem)
    const { month, grouping } = checked
    return HttpResponse.json(
      scenario === 'empty' ? usageOfMonth(month, grouping, []) : usageOfMonth(month, grouping),
    )
  }),
]
