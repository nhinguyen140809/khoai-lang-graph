import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useRunParameterFields } from '../useRunParameterFields'

describe('useRunParameterFields', () => {
  it('has no field while the workflow loads, then a field for each run parameter', async () => {
    const { result } = renderHookWithProviders(() => useRunParameterFields())

    expect(result.current).toEqual([])
    await waitFor(() => {
      expect(result.current.map(({ name }) => name)).toContain('max_turns')
    })
  })
})
