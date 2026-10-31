import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useModelSettings } from '../useModelSettingQueries'

describe('useModelSettings', () => {
  it('loads the two rows of the user', async () => {
    const { result } = renderHookWithProviders(() => useModelSettings())

    await waitForSuccess(result)
    expect(result.current.data).toHaveLength(2)
  })

  itWaitsUntilEnabled([
    { name: 'useModelSettings', useHook: () => useModelSettings({ isEnabled: false }) },
  ])
})
