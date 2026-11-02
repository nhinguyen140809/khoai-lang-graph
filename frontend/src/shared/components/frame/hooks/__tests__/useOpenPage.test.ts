import { renderHook } from '@testing-library/react'
import type { Route } from 'next'
import { describe, expect, it } from 'vitest'

import { routerMock } from '@/test/next-stubs'

import { frameWrapper } from '../../__tests__/frame-wrapper.utils.data'
import type { Destination } from '../../destinations/destination.types'
import { useSideFeatureStore } from '../../destinations/side-feature.store'
import { PanelRegion } from '../../panels/panel.types'
import { usePanelsStore } from '../../panels/panels.store'
import { useEditorTabsStore } from '../../tabs/editor-tabs.store'
import { useOpenPage } from '../useOpenPage'
import { openPageCases } from './useOpenPage.data'

const destinations: Destination[] = [
  {
    id: 'artifacts',
    label: 'Artifacts',
    icon: null,
    href: '/projects/p1/artifacts' as Route,
    panel: null,
  },
]

describe('useOpenPage', () => {
  it.each(openPageCases)('opens $name', ({ href, options, chosen, sideVisible, keepNext }) => {
    usePanelsStore.getState().togglePanel(PanelRegion.Side)
    const { result } = renderHook(() => useOpenPage(), { wrapper: frameWrapper({ destinations }) })

    result.current(href, options)

    expect(routerMock.push).toHaveBeenCalledExactlyOnceWith(href)
    expect(useSideFeatureStore.getState().chosen).toBe(chosen)
    expect(usePanelsStore.getState().panels[PanelRegion.Side].visible).toBe(sideVisible)
    const pending = useEditorTabsStore.getState().pendingOpen
    expect(pending?.keep === true ? pending.href : null).toBe(keepNext)
  })
})

describe('useOpenPage in place', () => {
  function renderInGroup(group: string | null) {
    return renderHook(() => useOpenPage(), {
      wrapper: frameWrapper({ destinations, tabGroup: group }),
    })
  }

  it('asks the next tab to take the place of the tab on screen', () => {
    useEditorTabsStore
      .getState()
      .openTab('p1', { id: 'a', title: 'A', href: '/projects/p1/artifacts/a' })
    const { result } = renderInGroup('p1')

    result.current('/projects/p1/artifacts/b' as Route, { inPlace: true })

    expect(useEditorTabsStore.getState().pendingOpen).toEqual({
      href: '/projects/p1/artifacts/b',
      keep: false,
      replaceTabId: 'a',
      title: null,
    })
  })

  it('opens the page as usual outside a workspace with tabs', () => {
    const { result } = renderInGroup(null)

    result.current('/projects/p1/artifacts/b' as Route, { inPlace: true })

    expect(useEditorTabsStore.getState().pendingOpen).toBeNull()
    expect(routerMock.push).toHaveBeenCalledWith('/projects/p1/artifacts/b')
  })
})
