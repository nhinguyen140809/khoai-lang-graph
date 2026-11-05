import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { openPage } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'

import { useDocumentsUnderReview, useIsDocumentUnderReview } from '../useDocumentsUnderReview'

const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
const plan = artifactFixtureByKind(projectIds.mentor, 'elicitation_plan')

describe('useIsDocumentUnderReview', () => {
  it('holds for the document that the pending review lists', async () => {
    const { result } = renderHookWithProviders(() =>
      useIsDocumentUnderReview(projectIds.mentor, analysis.id),
    )

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('does not hold for a document that the pending review does not list', async () => {
    const { result } = renderHookWithProviders(() =>
      useIsDocumentUnderReview(projectIds.mentor, plan.id),
    )

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})

describe('the interrupt of the review', () => {
  it('gives the pending interrupt of the run that waits, and none when the run goes on', async () => {
    const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
    const { result } = renderHookWithProviders(() => useDocumentsUnderReview(projectIds.mentor))

    await waitFor(() => {
      expect(result.current.run).not.toBeNull()
    })
    // The default state of the mock: run 3 waits at the analysis review, which allows edits.
    expect(result.current.interrupt?.allow_edits).toBe(true)
    expect(
      result.current.interrupt?.review_artifacts.map(({ artifact_id }) => artifact_id),
    ).toEqual([analysis.id])

    openPage('/?mock-run-status=done')
    const ended = renderHookWithProviders(() => useDocumentsUnderReview(projectIds.mentor))
    await waitFor(() => {
      expect(ended.result.current.run?.status).toBe('succeeded')
    })
    expect(ended.result.current.interrupt).toBeNull()
  })
})
