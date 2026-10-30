import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'
import { assertPresent } from '@/shared/lib/guards'

import { findRun } from '../runs/lookup/runs.lookup'
import { runNotFound } from '../runs/runs.problems'
import {
  hasMatchingParam,
  idempotent,
  pathParam,
  queryOf,
  readBodyFields,
} from '../shared/http/request'
import { accepted, paginate, validationFailed } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { resolveInterrupt } from './interrupts.changes'
import { interruptsOfRun, pendingInterruptOf } from './interrupts.lookup'
import { refuseAnswerOfOtherInterrupt } from './interrupts.problems'
import { validateResumeBody } from './interrupts.validators'

export const interruptHandlers = [
  http.get(apiEndpoints.runInterrupts.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('interrupts')
    const run = findRun(pathParam(params, 'runId'))
    if (run === undefined) return runNotFound()
    const interrupts = (scenario === 'empty' ? [] : interruptsOfRun(run)).filter(({ status }) =>
      hasMatchingParam(queryOf(request), 'status', status),
    )
    return HttpResponse.json(paginate(interrupts, request))
  }),

  http.post(
    apiEndpoints.runResume.pattern,
    idempotent(async ({ params, request }) => {
      await answerScenario('resume-run')
      const run = findRun(pathParam(params, 'runId'))
      if (run === undefined) return runNotFound()
      const fields = await readBodyFields(request)
      const pending = pendingInterruptOf(run)
      const refusal = refuseAnswerOfOtherInterrupt(pending, fields.interrupt_id)
      if (refusal !== null) return refusal
      // The refusal is null only when the run waits for this answer.
      const interrupt = assertPresent(pending, 'The run waits for this answer.')
      const checked = validateResumeBody(interrupt, fields)
      if ('problems' in checked) return validationFailed(checked.problems)
      resolveInterrupt(run, interrupt, checked.decision)
      return accepted(
        assertPresent(findRun(run.id), 'The run whose review was answered no longer exists.'),
      )
    }),
  ),
]
