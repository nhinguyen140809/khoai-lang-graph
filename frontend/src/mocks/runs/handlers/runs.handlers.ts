import { http, HttpResponse } from 'msw'

import { isUnfinishedRunStatus } from '@/modules/run/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'

import { mockNow } from '../../shared/db'
import { idempotent, pathParam, readBodyFields } from '../../shared/http/request'
import {
  created,
  emptyResponse,
  invalidState,
  paginate,
  validationFailed,
} from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import { allRuns, findRun, stepsOfRun } from '../lookup/runs.lookup'
import { addRun, changeRun } from '../runs.changes'
import { refuseUnfinishedRun, runNotFound } from '../runs.problems'
import { validateRetryBody } from '../runs.validators'

export const runHandlers = [
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

  http.post(apiEndpoints.runCancel.pattern, async ({ params }) => {
    await answerScenario('cancel-run')
    const run = findRun(pathParam(params, 'runId'))
    if (run === undefined) return runNotFound()
    if (!isUnfinishedRunStatus(run.status)) return invalidState('The run has already ended.')
    changeRun(run.id, { status: 'cancelled', finished_at: mockNow() })
    return emptyResponse(HttpStatus.Accepted)
  }),

  http.post(
    apiEndpoints.runRetry.pattern,
    idempotent(async ({ params, request }) => {
      await answerScenario('retry-run')
      const source = findRun(pathParam(params, 'runId'))
      if (source === undefined) return runNotFound()
      const checked = validateRetryBody(source.id, await readBodyFields(request))
      if ('problems' in checked) return validationFailed(checked.problems)
      const refusal = refuseUnfinishedRun(source.thread_id)
      if (refusal !== null) return refusal
      return created(
        addRun({
          threadId: source.thread_id,
          projectId: source.project_id,
          status: 'queued',
          currentStage: checked.step.stage,
          retryOfRunId: source.id,
          stepCount: checked.step.sequence - 1,
          startedAt: mockNow(),
        }),
      )
    }),
  ),
]
