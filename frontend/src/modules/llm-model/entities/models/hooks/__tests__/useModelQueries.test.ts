import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useModels } from '../useModelQueries'

describe('useModels', () => {
  it('loads the catalog', async () => {
    const { result } = renderHookWithProviders(() => useModels())

    await waitForSuccess(result)
    expect(result.current.data).toHaveLength(6)
  })

  itWaitsUntilEnabled([{ name: 'useModels', useHook: () => useModels({ isEnabled: false }) }])
})
