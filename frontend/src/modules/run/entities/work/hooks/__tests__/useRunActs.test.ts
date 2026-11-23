import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useRunActs } from '../useRunActs'

describe('useRunActs', () => {
  it('gives the acts of the stage that the run is in, once the definition has loaded', async () => {
    const { result } = renderHookWithProviders(() =>
      useRunActs({
        id: runIds.mentorMain3,
        status: 'running',
        workflow_version: 2,
        current_stage: 'interviewing',
      }),
    )

    expect(result.current).toEqual([])
    await waitFor(() => {
      expect(result.current).toEqual(['interview', 'typing', 'question'])
    })
  })

  it('gives none without a run', () => {
    const { result } = renderHookWithProviders(() => useRunActs(null))

    expect(result.current).toEqual([])
  })
})
