import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useRunSteps } from '../useRunStepQueries'

describe('useRunSteps', () => {
  it('loads the steps of a run', async () => {
    const { result } = renderHookWithProviders(() => useRunSteps(runIds.mentorMain3))

    await waitForSuccess(result)
    const steps = pageItems(result.current.data)
    expect(steps).toHaveLength(67)
    expect(steps.at(-1)).toMatchObject({ node: 'checkpoint_analysis', status: 'running' })
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    { name: 'useRunSteps', useHook: () => useRunSteps(runIds.mentorMain3, { isEnabled: false }) },
  ])
})
