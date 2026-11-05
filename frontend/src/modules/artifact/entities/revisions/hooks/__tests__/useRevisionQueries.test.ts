import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useArtifactRevisions, useItemRevisions, useRevisionHistory } from '../useRevisionQueries'

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

describe('useRevisionHistory', () => {
  it('loads the versions of an item, newest first, and of an artifact, while it is enabled', async () => {
    const item = renderHookWithProviders(() =>
      useRevisionHistory({ type: 'item', id: requirement.id }, { isEnabled: true }),
    )
    await waitFor(() => {
      expect(item.result.current.state).toBe('success')
    })
    if (item.result.current.state === 'success') {
      expect(item.result.current.revisions[0]?.version).toBe(requirement.version)
    }

    const artifact = renderHookWithProviders(() =>
      useRevisionHistory({ type: 'artifact', id: plan.id }, { isEnabled: true }),
    )
    await waitFor(() => {
      expect(artifact.result.current.state).toBe('success')
    })
    if (artifact.result.current.state === 'success') {
      expect(artifact.result.current.revisions.map(({ version }) => version)).toEqual([2, 1])
    }
  })

  it('reads nothing while it is not enabled', () => {
    const { result } = renderHookWithProviders(() =>
      useRevisionHistory({ type: 'item', id: requirement.id }, { isEnabled: false }),
    )

    expect(result.current).toEqual({ state: 'pending' })
  })

  it('gives AR-007 its two versions', async () => {
    const { result } = renderHookWithProviders(() =>
      useRevisionHistory(
        { type: 'item', id: itemFixtureByKey(projectId, 'AR-007').id },
        { isEnabled: true },
      ),
    )

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state === 'success') {
      expect(result.current.revisions.map(({ version }) => version)).toEqual([2, 1])
    }
  })
})
