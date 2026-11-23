import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useArtifactItemKinds } from '../useArtifactItemKinds'

describe('useArtifactItemKinds', () => {
  it('reads the kinds of item that each kind of artifact holds', async () => {
    const { result } = renderHookWithProviders(() => useArtifactItemKinds())

    await waitForSuccess(result)
    const itemKinds = result.current.data
    if (itemKinds === undefined) throw new Error('The kinds did not load')

    const ofSpecification = itemKinds.get('requirement_specification')
    expect(ofSpecification?.length).toBeGreaterThan(1)
    // The kinds come in the order of the definition, which the outline of a document reads.
    expect(ofSpecification?.[0]).toBe('section')
  })
})
