import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { sessionIds } from '../shared/db'
import { pathParam } from '../shared/http/request'
import { emptyPage, noContent, paginate } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { logOut } from './auth.changes'
import { removeSession } from './sessions.changes'
import { activeSessions, findActiveSession } from './sessions.lookup'
import { sessionNotFound } from './sessions.problems'

export const sessionHandlers = [
  http.get(apiEndpoints.sessions.pattern, async ({ request }) => {
    const scenario = await answerScenario('sessions')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    return HttpResponse.json(paginate(activeSessions(), request))
  }),

  http.delete(apiEndpoints.session.pattern, async ({ params }) => {
    await answerScenario('revoke-session')
    const session = findActiveSession(pathParam(params, 'sessionId'))
    if (session === undefined) return sessionNotFound()
    // Revoking the session of this browser logs the user out.
    if (session.id === sessionIds.current) logOut()
    else removeSession(session.id)
    return noContent()
  }),
]
