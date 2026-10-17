import { http, HttpResponse } from 'msw'

import { mockRecord } from '../shared/mock-db.utils'
import { answerScenario } from '../shared/mock-scenario.utils'
import { notFound } from '../shared/problem.utils'
import { mockMe } from './me.fixtures'

/** The signed-in user; registering an account replaces it. */
export const meRecord = mockRecord('me', () => mockMe)

export const meHandlers = [
  http.get('/api/v1/me', async () => {
    const scenario = await answerScenario('me')
    return scenario === 'empty' ? notFound('The user') : HttpResponse.json(meRecord.get())
  }),
]
