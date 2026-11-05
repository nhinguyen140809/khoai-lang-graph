import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { updateArtifact } from '../../../artifacts/artifacts.api'
import { useArtifact, useProjectArtifacts } from '../../../artifacts/hooks/useArtifactQueries'
import { updateItem } from '../../items.api'
import { useApplyRecordChange } from '../useApplyRecordChange'
import { useItem } from '../useItemQueries'

const projectId = projectIds.mentor

describe('useApplyRecordChange', () => {
  it('puts the answer in the detail key of a record, and loads the lists again', async () => {
    const item = itemFixtureByKey(projectId, 'AR-001')
    const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')

    const { result } = renderHookWithProviders(() => ({
      apply: useApplyRecordChange(),
      item: useItem(item.id),
      artifact: useArtifact(analysis.id),
      list: useProjectArtifacts(projectId),
    }))

    await waitFor(() => {
      expect(result.current.item.data).toBeDefined()
      expect(result.current.artifact.data).toBeDefined()
      expect(result.current.list.isSuccess).toBe(true)
    })
    const listLoadedAt = result.current.list.dataUpdatedAt

    const savedItem = await updateItem(item.id, item.version, {
      content: { title: 'List mentors fast' },
    })
    await result.current.apply({ type: 'item', record: savedItem })
    await waitFor(() => {
      expect(result.current.item.data?.content.title).toBe('List mentors fast')
    })

    // The change of the item gave the artifact a new version; the artifact is saved from the
    // version it is at now.
    const analysisNow = result.current.artifact.data
    if (analysisNow === undefined) throw new Error('The analysis did not load again')

    const savedArtifact = await updateArtifact(analysis.id, analysisNow.version, {
      title: 'Analysis of the interviews',
    })
    await result.current.apply({ type: 'artifact', record: savedArtifact })
    await waitFor(() => {
      expect(result.current.artifact.data?.title).toBe('Analysis of the interviews')
    })

    await waitFor(() => {
      expect(result.current.list.dataUpdatedAt).toBeGreaterThan(listLoadedAt)
    })
  })
})
