import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useHasPainted } from '../useHasPainted'

describe('useHasPainted', () => {
  it('is false at first and true after a frame', async () => {
    const { result } = renderHook(() => useHasPainted())

    expect(result.current).toBe(false)
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })
})
