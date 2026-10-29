import { http, HttpResponse } from 'msw'

import { isUnfinishedRunStatus } from '@/modules/run/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { isString } from '@/shared/lib/guards'

import { createdId, IdPrefix, mockNow, startedRunId } from '../../shared/db'
import { idempotent, pathParam, readBodyFields } from '../../shared/http/request'
import {
  created,
  emptyResponse,
  invalidState,
  paginate,
  validationFailed,
} from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import { buildRun, noUsage } from '../fixtures/runs.fixtures'
import { allRuns, findRun, stepsOfRun } from '../lookup/runs.lookup'
import { changeRun } from '../runs.changes'
import { runNotFound } from '../runs.problems'
import { createdRuns } from '../runs.store'

export const runHandlers = [
  // The chat starts a run with this endpoint, which is not part of the API; it goes with the chat.
  http.post(apiEndpoints.threadRuns.pattern, () => HttpResponse.json({ run_id: startedRunId })),

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

  http.post(
    apiEndpoints.runRetry.pattern,
    idempotent(async ({ params, request }) => {
      await answerScenario('retry-run')
      const source = findRun(pathParam(params, 'runId'))
      if (source === undefined) return runNotFound()
      const { from_step_id: fromStepId } = await readBodyFields(request)
      const step = stepsOfRun(source.id).find(({ id }) => id === fromStepId)
      if (!isString(fromStepId) || step === undefined) {
        return validationFailed([
          { field: 'from_step_id', message: 'Choose a step of the run to start from.' },
        ])
      }
      const runs = allRuns()
      if (
        runs.some(
          ({ thread_id: threadId, status }) =>
            threadId === source.thread_id && isUnfinishedRunStatus(status),
        )
      ) {
        return invalidState('The thread has a run that has not ended.')
      }
      const started = buildRun({
        id: createdId(IdPrefix.Run, createdRuns.get().length + 1),
        thread_id: source.thread_id,
        project_id: source.project_id,
        number: runs.filter(({ thread_id: threadId }) => threadId === source.thread_id).length + 1,
        status: 'queued',
        current_stage: step.stage,
        run_config: source.run_config,
        retry_of_run_id: source.id,
        usage: noUsage,
        step_count: step.sequence - 1,
        last_event_id: 0,
        started_at: mockNow(),
        finished_at: null,
      })
      createdRuns.set([...createdRuns.get(), started])
      return created(started)
    }),
  ),
]
