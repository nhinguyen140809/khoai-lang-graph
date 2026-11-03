import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { waitForQueries, waitForSuccess } from '@/test/steps'

import { useAllowedValues, useArtifact, useProjectArtifacts } from '../useArtifactQueries'

const projectId = projectIds.mentor
const plan = artifactFixtureByKind(projectId, 'elicitation_plan')

describe('useProjectArtifacts', () => {
  it('loads the artifacts of a project, narrowed by the filters', async () => {
    const { result } = renderHookWithProviders(() =>
      useProjectArtifacts(projectId, { kind: 'elicitation_plan' }),
    )

    await waitForSuccess(result)
    expect(result.current.data?.map(({ id }) => id)).toEqual([plan.id])
  })
})

describe('useArtifact', () => {
  it('loads one artifact', async () => {
    const { result } = renderHookWithProviders(() => useArtifact(plan.id))

    await waitFor(() => {
      expect(result.current.data?.id).toBe(plan.id)
    })
  })

  it('loads an artifact as it was at a version, apart from the current one', async () => {
    const { result } = renderHookWithProviders(() => ({
      now: useArtifact(plan.id),
      older: useArtifact(plan.id, 1),
    }))

    await waitForQueries(() => [result.current.now, result.current.older])
    expect(result.current.now.data?.version).toBe(plan.version)
    expect(result.current.older.data?.version).toBe(1)
  })
})

describe('useAllowedValues', () => {
  it('gives the entries of the field that a schema names, once the artifacts have loaded', async () => {
    const { result } = renderHookWithProviders(() =>
      useAllowedValues(projectId, 'elicitation_plan.stakeholder_types'),
    )

    expect(result.current).toEqual([])
    await waitFor(() => {
      expect(result.current).toEqual(['student', 'mentor', 'admin'])
    })
  })

  it('gives the same list again while the artifacts stay', async () => {
    const { result, rerender } = renderHookWithProviders(() =>
      useAllowedValues(projectId, 'elicitation_plan.stakeholder_types'),
    )
    await waitFor(() => {
      expect(result.current).toHaveLength(3)
    })
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
