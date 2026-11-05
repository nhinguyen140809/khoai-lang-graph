import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { contentFields } from '@/modules/workflow/entities'
import { assertPresent } from '@/shared/lib/guards'
import { renderHookWithProviders } from '@/test/render'
import { waitForQueries, waitForSuccess } from '@/test/steps'

import {
  useAllowedValues,
  useAllowedValuesOf,
  useArtifact,
  useProjectArtifacts,
} from '../useArtifactQueries'

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

describe('useAllowedValuesOf', () => {
  it('gives the values of each field that names a source, from one read of the artifacts', async () => {
    const fields = contentFields(contentSchemaFixtureByKind('persona'))
    const withPlainField = [
      ...fields,
      { ...assertPresent(fields[0], 'No field'), name: 'note', allowedValuesFrom: null },
    ]

    const { result } = renderHookWithProviders(() => useAllowedValuesOf(projectId, withPlainField))

    await waitFor(() => {
      expect(result.current.get('stakeholder_type')).toEqual(['student', 'mentor', 'admin'])
    })
    expect(result.current.has('note')).toBe(false)
  })
})
