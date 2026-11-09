import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useItemTitleOf } from '../useItemTitleOf'

const item = itemFixtureByKey(projectIds.mentor, 'AR-003')

describe('useItemTitleOf', () => {
  it('gives the key of an item until the kinds load, then its title', async () => {
    const { result } = renderHookWithProviders(() => useItemTitleOf())

    expect(result.current(item)).toBe(item.key)
    await waitFor(() => {
      expect(result.current(item)).toBe('Search with free hours')
    })
  })

  it('keeps the same reader while the kinds stay as they are', async () => {
    const { result, rerender } = renderHookWithProviders(() => useItemTitleOf())
    await waitFor(() => {
      expect(result.current(item)).not.toBe(item.key)
    })
    const reader = result.current

    rerender()

    expect(result.current).toBe(reader)
  })
})
