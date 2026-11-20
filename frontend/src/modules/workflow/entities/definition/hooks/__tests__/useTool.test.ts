import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useTool } from '../useTool'

describe('useTool', () => {
  it('reads none for a key that a version of the workflow does not list', async () => {
    const { result } = renderHookWithProviders(() => useTool(1, 'nothing'))

    await waitFor(() => {
      expect(result.current).toBeUndefined()
    })
  })

  it('reads none while no version is given', () => {
    const { result } = renderHookWithProviders(() => useTool(undefined, 'search'))

    expect(result.current).toBeUndefined()
  })
})
