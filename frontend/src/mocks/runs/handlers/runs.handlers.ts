import { http, HttpResponse } from 'msw'

import { isUnfinishedRunStatus } from '@/modules/run/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'

import { mockNow } from '../../shared/db'
import { pathParam } from '../../shared/http/request'
import { emptyResponse, invalidState, paginate } from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import { changeRun } from '../runs.changes'
import { allRuns, findRun, stepsOfRun } from '../runs.lookup'
import { runNotFound } from '../runs.problems'

// The chat starts a run with this endpoint, which is not part of the API; it goes with the chat.
export const mockRunId = 'run-mock-1'

export const runHandlers = [
  http.post(apiEndpoints.threadRuns.pattern, () => HttpResponse.json({ run_id: mockRunId })),

  http.get(apiEndpoints.threadRuns.pattern, async ({ params, request }) => {
    await answerScenario('runs')
    const runs = allRuns()
      .filter((run) => run.thread_id === pathParam(params, 'threadId'))
      .toSorted((a, b) => b.number - a.number)
    return HttpResponse.json(paginate(runs, request))
  }),

  http.get(apiEndpoints.run.pattern, async ({ params }) => {
    await answerScenario('runs')
    const run = findRun(pathParam(params, 'runId'))
    return run === undefined ? runNotFound() : HttpResponse.json(run)
  }),

  http.get(apiEndpoints.runSteps.pattern, async ({ params, request }) => {
    await answerScenario('runs')
    const runId = pathParam(params, 'runId')
    if (findRun(runId) === undefined) return runNotFound()
    return HttpResponse.json(paginate(stepsOfRun(runId), request))
  }),

  http.post(apiEndpoints.runCancel.pattern, ({ params }) => {
    const run = findRun(pathParam(params, 'runId'))
    if (run === undefined) return runNotFound()
    if (!isUnfinishedRunStatus(run.status)) return invalidState('The run has already ended.')
    changeRun(run.id, { status: 'cancelled', finished_at: mockNow() })
    return emptyResponse(HttpStatus.Accepted)
  }),
]
