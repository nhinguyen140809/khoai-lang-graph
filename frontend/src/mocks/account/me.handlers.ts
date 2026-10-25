import { http, HttpResponse } from 'msw'

import { mockRecord } from '../shared/db/mock-state.utils'
import { notFound } from '../shared/http/response/error-response.utils'
import { answerScenario } from '../shared/scenario/mock-scenario.utils'
import { mockMe } from './me.fixtures'

/** The signed-in user; registering an account replaces it. */
export const meRecord = mockRecord('me', () => mockMe)

export const meHandlers = [
  http.get('/api/v1/me', async () => {
    const scenario = await answerScenario('me')
    return scenario === 'empty' ? notFound('The user') : HttpResponse.json(meRecord.get())
  }),
]
