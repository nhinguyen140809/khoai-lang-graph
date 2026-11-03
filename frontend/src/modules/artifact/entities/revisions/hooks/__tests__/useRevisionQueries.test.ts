import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useArtifactRevisions, useItemRevisions } from '../useRevisionQueries'

const projectId = projectIds.mentor
const plan = artifactFixtureByKind(projectId, 'elicitation_plan')
const requirement = itemFixtureByKey(projectId, 'REQ-001')

describe('useArtifactRevisions', () => {
  it('loads the versions of an artifact, newest first', async () => {
    const { result } = renderHookWithProviders(() => useArtifactRevisions(plan.id))

    await waitForSuccess(result)
    expect(result.current.data?.pages[0]?.items.map(({ version }) => version)).toEqual([2, 1])
    expect(result.current.hasNextPage).toBe(false)
  })
})

describe('useItemRevisions', () => {
  it('loads the versions of an item, newest first', async () => {
    const { result } = renderHookWithProviders(() => useItemRevisions(requirement.id))

    await waitForSuccess(result)
    expect(result.current.data?.pages[0]?.items[0]?.version).toBe(requirement.version)
  })
})
