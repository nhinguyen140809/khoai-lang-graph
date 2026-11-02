import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useArtifactDocument } from '../useArtifactDocument'

const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')

describe('useArtifactDocument', () => {
  it('is pending until the artifact and its items load', () => {
    const { result } = renderHookWithProviders(() => useArtifactDocument(analysis.id))

    expect(result.current.state).toBe('pending')
  })

  it('gives the artifact, its blocks and the kinds that draw them', async () => {
    const { result } = renderHookWithProviders(() => useArtifactDocument(analysis.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const document = result.current
    if (document.state !== 'success') throw new Error('The document did not load')
    expect(document.artifact.id).toBe(analysis.id)
    expect(document.blocks.length).toBeGreaterThan(0)
    expect(document.kinds.size).toBeGreaterThan(0)
  })

  it('gives the filled fields of an artifact in the order of its schema', async () => {
    const plan = artifactFixtureByKind(projectIds.mentor, 'elicitation_plan')
    const { result } = renderHookWithProviders(() => useArtifactDocument(plan.id))

    await waitFor(() => {
      expect(result.current.state === 'success' && result.current.fields.length).toBeGreaterThan(0)
    })
    const document = result.current
    expect(document.state === 'success' && document.fields.map(({ name }) => name)).toContain(
      'objectives',
    )
  })

  it('says not found for an artifact that does not exist', async () => {
    const { result } = renderHookWithProviders(() => useArtifactDocument('missing-artifact'))

    await waitFor(() => {
      expect(result.current.state).toBe('notFound')
    })
  })
})
