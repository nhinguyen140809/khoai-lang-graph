import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'

import { useAgentRoleLabels } from '../useAgentRoleLabels'

describe('useAgentRoleLabels', () => {
  it('reads the labels of the agent roles in a version of the workflow', async () => {
    const { result } = renderHookWithProviders(() => useAgentRoleLabels(1))

    await waitFor(() => {
      expect(result.current.size).toBeGreaterThan(0)
    })
    expect(result.current.get('analyst')).toBe('Analyst')
  })

  it('reads none while no version is given', () => {
    const { result } = renderHookWithProviders(() => useAgentRoleLabels(undefined))

    expect(result.current.size).toBe(0)
  })
})
