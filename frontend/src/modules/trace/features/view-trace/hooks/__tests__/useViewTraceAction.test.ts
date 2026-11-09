import { act } from '@testing-library/react'
import { WaypointsIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { routerMock } from '@/test/next-stubs'
import { renderHookWithProviders } from '@/test/render'

import { useViewTraceAction } from '../useViewTraceAction'

const projectId = projectIds.mentor

describe('useViewTraceAction', () => {
  it('gives the words and the icon of the action, never disabled', () => {
    const { result } = renderHookWithProviders(() => useViewTraceAction(projectId))

    expect(result.current({ id: 'item-1' })).toMatchObject({
      icon: WaypointsIcon,
      label: 'View its trace',
      disabledReason: null,
    })
  })

  it('opens the page of the trace of the item', () => {
    const { result } = renderHookWithProviders(() => useViewTraceAction(projectId))
    routerMock.push.mockClear()

    act(() => {
      result.current({ id: 'item-1', title: 'Search' }).run()
    })

    expect(routerMock.push).toHaveBeenCalledWith(`/projects/${projectId}/trace/items/item-1`)
  })

  it('opens the trace of an item that has no title yet', () => {
    const { result } = renderHookWithProviders(() => useViewTraceAction(projectId))
    routerMock.push.mockClear()

    act(() => {
      result.current({ id: 'item-1' }).run()
    })

    expect(routerMock.push).toHaveBeenCalledWith(`/projects/${projectId}/trace/items/item-1`)
  })
})
