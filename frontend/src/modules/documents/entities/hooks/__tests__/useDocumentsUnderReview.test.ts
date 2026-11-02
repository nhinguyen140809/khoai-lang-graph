import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useIsDocumentUnderReview } from '../useDocumentsUnderReview'

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
