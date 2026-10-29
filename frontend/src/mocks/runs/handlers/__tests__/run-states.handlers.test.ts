import { describe, expect, it } from 'vitest'

import type { RunState } from '@/modules/run/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { ApiAnswer } from '@/test/msw'
import { fetchApi } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { runIds } from '../../../shared/db'
import { runStepFixtures } from '../../fixtures/runs.fixtures'
import { refusedStateCases, stateCases } from './run-states.handlers.data'

const stepsOfRun3 = runStepFixtures(runIds.mentorMain3, 'waiting')

describe('GET /runs/{run_id}/state', () => {
  it('answers the current state of the run, after its last step', async () => {
    const { body } = (await fetchApi(
      apiEndpoints.runState.path({ runId: runIds.mentorMain3 }),
    )) as ApiAnswer<RunState>

    expect(body).toMatchObject({
      run_id: runIds.mentorMain3,
      step_id: stepsOfRun3.at(-1)?.id,
      workflow_version: 1,
    })
    expect(body.values).toMatchObject({ current_stage: 'analysis_review', iteration_count: 0 })
  })

  it('has a state for a run that has no step yet', async () => {
    const { body } = (await fetchApi(
      apiEndpoints.runState.path({ runId: runIds.libraryMain1 }),
    )) as ApiAnswer<RunState>

    expect(body.run_id).toBe(runIds.libraryMain1)
  })
})

describe('GET /runs/{run_id}/steps/{step_id}/state', () => {
  it.each(stateCases)('answers the state after $name', async ({ stepSequence, stage, listed }) => {
    const step = stepsOfRun3.find(({ sequence }) => sequence === stepSequence)

    const { body } = (await fetchApi(
      apiEndpoints.runStepState.path({ runId: runIds.mentorMain3, stepId: step?.id ?? '' }),
    )) as ApiAnswer<RunState>

    expect(body.step_id).toBe(step?.id)
    expect(body.values.current_stage).toBe(step?.stage)
    expect(body.values.current_stage).toBe(stage)
    expect((body.values.personas as unknown[]).length).toBe(listed.personas)
  })
})

describe('errors', () => {
  itRejectsRequests(refusedStateCases)
})
