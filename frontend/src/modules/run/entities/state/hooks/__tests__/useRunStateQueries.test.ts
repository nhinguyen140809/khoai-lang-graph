import { describe, expect, it } from 'vitest'

import { runStepFixtures } from '@/mocks/runs/fixtures/runs.fixtures'
import { runIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useCurrentRunState, useRunStateAfterStep } from '../useRunStateQueries'

describe('useCurrentRunState', () => {
  it('loads the current state of a run', async () => {
    const { result } = renderHookWithProviders(() => useCurrentRunState(runIds.mentorMain3))

    await waitForSuccess(result)
    expect(result.current.data?.values).toMatchObject({ current_stage: 'analysis_review' })
  })
})

describe('useRunStateAfterStep', () => {
  it('loads the state after a step', async () => {
    const [first] = runStepFixtures(runIds.mentorMain3, 'waiting')
    const { result } = renderHookWithProviders(() =>
      useRunStateAfterStep(runIds.mentorMain3, first?.id ?? ''),
    )

    await waitForSuccess(result)
    expect(result.current.data?.step_id).toBe(first?.id)
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useCurrentRunState',
      useHook: () => useCurrentRunState(runIds.mentorMain3, { isEnabled: false }),
    },
    {
      name: 'useRunStateAfterStep',
      useHook: () => useRunStateAfterStep(runIds.mentorMain3, 's1', { isEnabled: false }),
    },
  ])
})
