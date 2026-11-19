import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useRunLastWork } from '../useRunLastWork'

describe('useRunLastWork', () => {
  it('is the last phase of the run, with the agent that ran it, once the steps have loaded', async () => {
    const { result } = renderHookWithProviders(() =>
      useRunLastWork({ id: runIds.mentorMain3, status: 'running' }),
    )

    expect(result.current).toBeUndefined()
    await waitFor(() => {
      expect(result.current?.agentRole).toBeTypeOf('string')
    })
  })

  it('is nothing without a run', () => {
    const { result } = renderHookWithProviders(() => useRunLastWork(null))

    expect(result.current).toBeUndefined()
  })
})
