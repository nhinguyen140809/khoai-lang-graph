import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { pathParam } from '../../shared/http/request'
import { paginate } from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import { directivesOfRun } from '../lookup/directives.lookup'
import { findRun } from '../lookup/runs.lookup'
import { runNotFound } from '../runs.problems'

export const directiveHandlers = [
  http.get(apiEndpoints.runDirectives.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('directives')
    const runId = pathParam(params, 'runId')
    if (findRun(runId) === undefined) return runNotFound()
    return HttpResponse.json(paginate(scenario === 'empty' ? [] : directivesOfRun(runId), request))
  }),
]
