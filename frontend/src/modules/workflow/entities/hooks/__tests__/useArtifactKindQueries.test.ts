import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useArtifactKinds } from '../useArtifactKindQueries'

describe('useArtifactKinds', () => {
  it('loads the kinds with their content schemas', async () => {
    const { result } = renderHookWithProviders(() => useArtifactKinds())

    await waitForSuccess(result)
    expect(result.current.data?.artifact_kinds.length).toBeGreaterThan(0)
  })

  it('loads the kinds of a workflow version', async () => {
    const { result } = renderHookWithProviders(() => useArtifactKinds(1))

    await waitForSuccess(result)
    expect(result.current.data?.workflow_version).toBe(1)
  })
})
