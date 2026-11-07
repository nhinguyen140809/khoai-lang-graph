import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useReloadRunSteps, useRunSteps } from '../useRunStepQueries'

describe('useRunSteps', () => {
  it('loads the steps of a run', async () => {
    const { result } = renderHookWithProviders(() => useRunSteps(runIds.mentorMain3))

    await waitForSuccess(result)
    const steps = pageItems(result.current.data)
    expect(steps).toHaveLength(67)
    expect(steps.at(-1)).toMatchObject({ node: 'checkpoint_analysis', status: 'running' })
  })
})

describe('useReloadRunSteps', () => {
  it('loads the steps of a run again', async () => {
    const steps = renderHookWithProviders(() => useRunSteps(runIds.mentorMain3))
    await waitForSuccess(steps.result)
    const reload = renderHookWithProviders(() => useReloadRunSteps()).result.current

    await reload(runIds.mentorMain3)
    await waitForSuccess(steps.result)

    // The load again brings the same steps of the mock, with their current state.
    expect(pageItems(steps.result.current.data)).toHaveLength(67)
    steps.unmount()
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    { name: 'useRunSteps', useHook: () => useRunSteps(runIds.mentorMain3, { isEnabled: false }) },
  ])
})
