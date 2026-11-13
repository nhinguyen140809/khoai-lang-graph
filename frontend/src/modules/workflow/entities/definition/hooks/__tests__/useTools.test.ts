import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useTools } from '../useTools'

describe('useTools', () => {
  it('reads none for a version of the workflow that lists no tools', async () => {
    const { result } = renderHookWithProviders(() => useTools(1))

    await waitFor(() => {
      expect(result.current.size).toBe(0)
    })
  })

  it('reads none while no version is given', () => {
    const { result } = renderHookWithProviders(() => useTools(undefined))

    expect(result.current.size).toBe(0)
  })
})
