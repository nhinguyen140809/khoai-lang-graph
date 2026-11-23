import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useWorkflowDefinition } from '../useWorkflowDefinition'

describe('useWorkflowDefinition', () => {
  it('loads the current definition', async () => {
    const { result } = renderHookWithProviders(() => useWorkflowDefinition())

    await waitForSuccess(result)
    expect(result.current.data?.version).toBe(2)
  })

  it('loads the definition at a version', async () => {
    const { result } = renderHookWithProviders(() => useWorkflowDefinition(2))

    await waitForSuccess(result)
    expect(result.current.data?.stages.length).toBeGreaterThan(0)
  })
})
