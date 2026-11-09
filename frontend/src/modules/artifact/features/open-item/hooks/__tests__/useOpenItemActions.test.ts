import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { routerMock } from '@/test/next-stubs'
import { renderHookWithProviders } from '@/test/render'

import { useOpenItemActions } from '../useOpenItemActions'

const projectId = projectIds.mentor

describe('useOpenItemActions', () => {
  it('gives the two ways to open an item, each with its words and none of them disabled', () => {
    const { result } = renderHookWithProviders(() => useOpenItemActions(projectId))

    const { open, openInNewTab } = result.current({ id: 'item-1' })

    expect([open.label, openInNewTab.label]).toEqual(['Open', 'Open in a new tab'])
    expect([open, openInNewTab].map(({ disabledReason }) => disabledReason)).toEqual([null, null])
  })

  it('opens the page of the item for both ways', () => {
    const { result } = renderHookWithProviders(() => useOpenItemActions(projectId))
    const { open, openInNewTab } = result.current({ id: 'item-1', title: 'Search' })
    routerMock.push.mockClear()

    act(() => {
      open.run()
    })
    act(() => {
      openInNewTab.run()
    })

    expect(routerMock.push.mock.calls.map((call: unknown[]) => call[0])).toEqual([
      `/projects/${projectId}/items/item-1`,
      `/projects/${projectId}/items/item-1`,
    ])
  })

  it('opens the page of an item that has no title yet', () => {
    const { result } = renderHookWithProviders(() => useOpenItemActions(projectId))
    routerMock.push.mockClear()

    act(() => {
      result.current({ id: 'item-1' }).open.run()
    })

    expect(routerMock.push).toHaveBeenCalledWith(`/projects/${projectId}/items/item-1`)
  })
})
