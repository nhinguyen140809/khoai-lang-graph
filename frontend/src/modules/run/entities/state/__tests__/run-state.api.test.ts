import { describe, expect, it } from 'vitest'

import { runStepFixtures } from '@/mocks/runs/fixtures/runs.fixtures'
import { runIds } from '@/mocks/shared/db'
import { itSendsRequests } from '@/test/suites'

import { getCurrentRunState, getRunStateAfterStep } from '../run-state.api'
import { sentRequestCases } from './run-state.api.data'

describe('getCurrentRunState', () => {
  it('reads the state of a run now, at the stage where it waits', async () => {
    const state = await getCurrentRunState(runIds.mentorMain3)

    expect(state).toMatchObject({ run_id: runIds.mentorMain3, workflow_version: 1 })
    expect(state.values).toMatchObject({ current_stage: 'analysis_review', status: 'interrupted' })
  })

  it('throws for a run that does not exist', async () => {
    await expect(getCurrentRunState('missing')).rejects.toThrow('HTTP 404')
  })
})

describe('getRunStateAfterStep', () => {
  it('reads the state after a step, at the stage of that step', async () => {
    const [first] = runStepFixtures(runIds.mentorMain3, 'waiting')
    const state = await getRunStateAfterStep(runIds.mentorMain3, first?.id ?? '')

    expect(state.step_id).toBe(first?.id)
    expect(state.values).toMatchObject({ current_stage: 'planning', personas: [] })
  })

  it('throws for a step that does not exist', async () => {
    await expect(getRunStateAfterStep(runIds.mentorMain3, 'missing')).rejects.toThrow('HTTP 404')
  })
})

describe('requests', () => {
  itSendsRequests(sentRequestCases)
})
