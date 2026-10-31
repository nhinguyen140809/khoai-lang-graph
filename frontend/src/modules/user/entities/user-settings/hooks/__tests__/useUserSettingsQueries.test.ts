import { describe, expect, it } from 'vitest'

import { userSettingsFixture } from '@/mocks/user-settings/user-settings.fixtures'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useUserSettings } from '../useUserSettingsQueries'

describe('useUserSettings', () => {
  it('loads the settings of the user', async () => {
    const { result } = renderHookWithProviders(() => useUserSettings())

    await waitForSuccess(result)
    expect(result.current.data).toEqual(userSettingsFixture)
  })

  itWaitsUntilEnabled([
    { name: 'useUserSettings', useHook: () => useUserSettings({ isEnabled: false }) },
  ])
})
