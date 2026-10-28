import { waitFor } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useLinksCiting, useProjectTraceLinks } from '../useTraceLinkQueries'

const projectId = projectIds.mentor

describe('useProjectTraceLinks', () => {
  it('loads the links of a project', async () => {
    const { result } = renderHookWithProviders(() => useProjectTraceLinks(projectId))

    await waitForSuccess(result)
    const links = result.current.data?.pages.flatMap((page) => page.items) ?? []
    expect(links.length).toBeGreaterThan(0)
  })

  it('loads only the links of the type that the filters name', async () => {
    const { result } = renderHookWithProviders(() =>
      useProjectTraceLinks(projectId, { linkType: 'involves' }),
    )

    await waitForSuccess(result)
    const links = result.current.data?.pages.flatMap((page) => page.items) ?? []
    expect(links.length).toBeGreaterThan(0)
    expect(links.every(({ link_type }) => link_type === 'involves')).toBe(true)
  })

  it('has no next page when one page holds every link', async () => {
    const { result } = renderHookWithProviders(() => useProjectTraceLinks(projectId))

    await waitForSuccess(result)
    expect(result.current.hasNextPage).toBe(false)
    await act(async () => {
      await result.current.fetchNextPage()
    })
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(1)
    })
  })
})

describe('useLinksCiting', () => {
  it('loads the links that cite an item, each with its quote', async () => {
    const message = itemFixtureByKey(projectId, 'PER-001#2')
    const { result } = renderHookWithProviders(() => useLinksCiting(projectId, message.id))

    await waitForSuccess(result)
    const links = result.current.data?.pages.flatMap((page) => page.items) ?? []
    expect(links.length).toBeGreaterThan(0)
    expect(links.every((link) => link.target_item_id === message.id && link.quote !== null)).toBe(
      true,
    )
  })

  it('loads nothing until it is enabled', () => {
    const { result } = renderHookWithProviders(() =>
      useLinksCiting(projectId, 'item', { isEnabled: false }),
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})
