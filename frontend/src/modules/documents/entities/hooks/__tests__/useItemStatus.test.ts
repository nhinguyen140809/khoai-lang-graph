import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useItemStatus } from '../useItemStatus'

const projectId = projectIds.mentor

describe('useItemStatus', () => {
  it('gives the status of an item and whether its document is under review', async () => {
    const requirement = itemFixtureByKey(projectId, 'REQ-001')
    const { result } = renderHookWithProviders(() => useItemStatus(projectId, requirement))

    await waitFor(() => {
      expect(result.current.status).toBeDefined()
    })
    expect(result.current.status).toBe('approved')
    expect(result.current.isUnderReview).toBe(false)
  })

  it('gives an out of date item its state', async () => {
    const outOfDate = itemFixtureByKey(projectId, 'REQ-003')
    const { result } = renderHookWithProviders(() => useItemStatus(projectId, outOfDate))

    await waitFor(() => {
      expect(result.current.status).toBe('outOfDate')
    })
  })
})
