import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useSessions } from '../useSessionQueries'

describe('useSessions', () => {
  it('loads the three active sessions of the user', async () => {
    const { result } = renderHookWithProviders(() => useSessions())

    await waitForSuccess(result)
    expect(result.current.data).toHaveLength(3)
  })

  itWaitsUntilEnabled([{ name: 'useSessions', useHook: () => useSessions({ isEnabled: false }) }])
})
