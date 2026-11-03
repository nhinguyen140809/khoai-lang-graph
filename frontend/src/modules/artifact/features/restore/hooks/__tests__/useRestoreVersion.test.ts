import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useRestoreVersion } from '../useRestoreVersion'

const item = itemFixtureByKey(projectIds.mentor, 'AR-007')

describe('useRestoreVersion', () => {
  it('restores a version of an item, puts the answer in the cache and runs what follows', async () => {
    const onChanged = vi.fn()
    const { result } = renderHookWithProviders(() =>
      useRestoreVersion({ type: 'item', id: item.id }, { onChanged }),
    )

    result.current.mutate(1)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.version).toBe(3)
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledOnce()
    })
  })
})
