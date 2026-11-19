import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useKindLooks } from '../useKindLooks'

describe('useKindLooks', () => {
  it('gives the title of a kind and whether its items have pages', async () => {
    const { result } = renderHookWithProviders(() => useKindLooks())

    await waitFor(() => {
      expect(result.current.size).toBeGreaterThan(0)
    })
    expect(result.current.get('raw_requirement')).toEqual({
      title: 'Stated need',
      isNavigable: true,
    })
    expect(result.current.get('interview_message')).toMatchObject({ isNavigable: false })
  })

  it('is empty while the kinds load, and keeps the same map until they change', async () => {
    const { result, rerender } = renderHookWithProviders(() => useKindLooks())

    expect(result.current.size).toBe(0)
    await waitFor(() => {
      expect(result.current.size).toBeGreaterThan(0)
    })
    const loaded = result.current
    rerender()

    expect(result.current).toBe(loaded)
  })
})
