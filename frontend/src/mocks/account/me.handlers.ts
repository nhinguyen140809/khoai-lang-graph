import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { answerScenario } from '../shared/scenario/mock-scenario.utils'
import { currentUser } from './account.store'
import { userNotFound } from './me.problems'

export const meHandlers = [
  http.get(apiEndpoints.me.pattern, async () => {
    const scenario = await answerScenario('me')
    return scenario === 'empty' ? userNotFound() : HttpResponse.json(currentUser.get())
  }),
]
