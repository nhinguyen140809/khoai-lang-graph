import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { openPage } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'

import { useEditLockReason } from '../useEditLockReason'

const projectId = projectIds.mentor

describe('useEditLockReason', () => {
  it('gives no reason for the document under review by default', async () => {
    const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')
    const { result } = renderHookWithProviders(() => useEditLockReason(projectId, analysis.id))

    await waitFor(() => {
      expect(result.current).toBeNull()
    })
  })

  it('gives the reason of a document outside the review', async () => {
    const specification = artifactFixtureByKind(projectId, 'requirement_specification')
    const { result } = renderHookWithProviders(() => useEditLockReason(projectId, specification.id))

    await waitFor(() => {
      expect(result.current).toBe('Only the documents under review can change now.')
    })
  })

  it('gives the reason of a run that works', async () => {
    openPage('/?mock-run-status=running')
    const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')
    const { result } = renderHookWithProviders(() => useEditLockReason(projectId, analysis.id))

    await waitFor(() => {
      expect(result.current).toBe('Documents cannot change while the agents work.')
    })
  })

  it('gives the reason of a run that has ended', async () => {
    openPage('/?mock-run-status=done')
    const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')
    const { result } = renderHookWithProviders(() => useEditLockReason(projectId, analysis.id))

    await waitFor(() => {
      expect(result.current).toBe('A document can change while it waits for your review.')
    })
    expect(itemFixtureByKey(projectId, 'REQ-001').kind).toBe('spec_requirement')
  })
})
