import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useEditedItems } from '../useEditedItems'

describe('useEditedItems', () => {
  it('reads the edited items of the artifacts given, from the first page of each', async () => {
    // The requirements analysis of the mentor platform holds an item the user edited.
    const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
    const { result } = renderHookWithProviders(() => useEditedItems([analysis.id]))

    await waitFor(() => {
      expect(result.current.length).toBeGreaterThan(0)
    })
    expect(result.current.map(({ key }) => key)).toContain('AR-007')
  })

  it('reads none for an artifact without edited items', async () => {
    const plan = artifactFixtureByKind(projectIds.mentor, 'elicitation_plan')
    const { result } = renderHookWithProviders(() => useEditedItems([plan.id]))

    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })
})
