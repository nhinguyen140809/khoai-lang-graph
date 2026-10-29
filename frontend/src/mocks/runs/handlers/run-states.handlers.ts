import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { pathParam } from '../../shared/http/request'
import { notFound } from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import { stateOfRun } from '../lookup/run-states.lookup'
import { findRun, stepsOfRun } from '../lookup/runs.lookup'
import { runNotFound } from '../runs.problems'

export const runStateHandlers = [
  http.get(apiEndpoints.runState.pattern, async ({ params }) => {
    await answerScenario('workflow-state')
    const run = findRun(pathParam(params, 'runId'))
    if (run === undefined) return runNotFound()
    return HttpResponse.json(stateOfRun(run, null, stepsOfRun(run.id).at(-1) ?? null))
  }),

  http.get(apiEndpoints.runStepState.pattern, async ({ params }) => {
    await answerScenario('workflow-state')
    const run = findRun(pathParam(params, 'runId'))
    if (run === undefined) return runNotFound()
    const step = stepsOfRun(run.id).find(({ id }) => id === pathParam(params, 'stepId'))
    return step === undefined
      ? notFound('The step')
      : HttpResponse.json(stateOfRun(run, step, null))
  }),
]
